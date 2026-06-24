import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/db';
import { callFirebaseFunction } from '@/firebase/functions';
import { providerConverter, visibilityRequestConverter } from '@/firebase/converters';
import { nowIso } from '@/lib/dates';
import { productForVisibilityRequest } from '@/config/paid-products';
import type { PaymentMethod, PaidProductSnapshot } from '@/types/monetization';
import type { VisibilityRequest } from '@/types/visibility';
import type { VisibilityService } from '../contracts/visibility.contract';

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function normalizePaymentMethod(value: PaymentMethod | 'manual'): PaymentMethod {
  return value === 'manual' ? 'manual_cash' : value;
}

function snapshotProduct(type: VisibilityRequest['type'], now: string): PaidProductSnapshot {
  const product = productForVisibilityRequest(type ?? 'boost');
  if (!product) throw new Error('error.visibility.productUnavailable');
  return {
    productId: product.id,
    productVersion: product.version,
    productType: product.type,
    durationDays: product.durationDays,
    priceAmount: product.priceAmount,
    currency: product.currency,
    billingModel: product.billingModel,
    capPolicy: product.capPolicy,
    paymentProvider: product.paymentProvider,
    renewalPolicy: product.renewalPolicy,
    snapshotAt: now,
  };
}

export const firebaseVisibilityService: VisibilityService = {
  createVisibilityRequest: async (providerId, serviceArea, paymentMethod, notes) => {
    if (paymentMethod === 'paymob_card') {
      return callFirebaseFunction<
        { providerId: string; serviceArea: string; notes: string },
        VisibilityRequest
      >('startVisibilityPaymobPayment', { providerId, serviceArea, notes });
    }
    const db = requireFirebaseDb();
    const provider = await getDoc(doc(db, 'providers', providerId).withConverter(providerConverter));
    if (!provider.exists()) throw new Error('error.provider.notFound');
    if (provider.data().status !== 'approved') throw new Error('error.visibility.providerNotApproved');
    const isAreaExpansion = !provider.data().serviceAreaKeys.includes(serviceArea);
    if (isAreaExpansion && provider.data().reviewCount < 30) {
      throw new Error('error.visibility.areaExpansionRequiresReviews');
    }

    const pending = await getDocs(
      query(
        collection(db, 'visibilityRequests').withConverter(visibilityRequestConverter),
        where('providerId', '==', providerId),
        where('serviceArea', '==', serviceArea),
        where('status', '==', 'pending'),
      ),
    );
    if (!pending.empty) throw new Error('error.visibility.pendingExists');

    const requestRef = doc(collection(db, 'visibilityRequests'), createId('visibility')).withConverter(visibilityRequestConverter);
    const requestedAt = nowIso();
    const type = isAreaExpansion ? 'area_expansion' : 'boost';
    const request: VisibilityRequest = {
      id: requestRef.id,
      providerId,
      type,
      tier: 'paid',
      serviceArea,
      status: 'pending',
      paymentConfirmedBy: null,
      paymentMethod: normalizePaymentMethod(paymentMethod),
      paymentStatus: 'pending',
      paymentReference: null,
      paymentFailureReason: null,
      paymentSession: null,
      productSnapshot: snapshotProduct(type, requestedAt),
      disclosureVersion: 'visibility-no-guarantee-v1',
      disclosureAcceptedAt: requestedAt,
      notes,
      requestedAt,
      processedAt: null,
    };
    await setDoc(requestRef, request);
    return request;
  },
  listProviderVisibilityRequests: async (providerId) => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(
        collection(db, 'visibilityRequests').withConverter(visibilityRequestConverter),
        where('providerId', '==', providerId),
        orderBy('requestedAt', 'desc'),
      ),
    );
    return snapshot.docs.map((item) => item.data());
  },
};
