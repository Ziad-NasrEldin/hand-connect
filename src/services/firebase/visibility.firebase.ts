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
import { getFirebaseAuth } from '@/firebase/auth';
import { getFirebaseDb } from '@/firebase/db';
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

interface PaymobSessionResponse {
  checkoutUrl: string | null;
  merchantOrderId: string;
  integrationId: string;
  orderId: string | null;
  mode: 'mock' | 'live';
}

async function createPaymobSession(input: {
  providerId: string;
  requestId: string;
  amountCents: number;
  displayName: string;
  email: string;
  phone: string;
}) {
  const currentUser = getFirebaseAuth()?.currentUser;
  const idToken = await currentUser?.getIdToken();
  if (!idToken) throw new Error('error.auth.invalidCredentials');

  const [firstName = 'Herafy', ...lastNameParts] = input.displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const response = await fetch('/api/visibility/paymob-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      idToken,
      providerId: input.providerId,
      requestId: input.requestId,
      amountCents: input.amountCents,
      currency: 'EGP',
      billing: {
        first_name: firstName,
        last_name: lastNameParts.join(' ') || 'Provider',
        email: input.email,
        phone_number: input.phone || '01000000000',
      },
    }),
  });
  if (!response.ok) throw new Error('error.visibility.paymobCheckoutUnavailable');
  return response.json() as Promise<PaymobSessionResponse>;
}

export const firebaseVisibilityService: VisibilityService = {
  createVisibilityRequest: async (providerId, serviceArea, paymentMethod, notes) => {
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
    const productSnapshot = snapshotProduct(type, requestedAt);
    const paymobSession =
      paymentMethod === 'paymob_card'
        ? await createPaymobSession({
            providerId,
            requestId: requestRef.id,
            amountCents: Math.round((productSnapshot.priceAmount ?? 0) * 100),
            displayName: provider.data().displayName,
            email: getFirebaseAuth()?.currentUser?.email ?? `${providerId}@providers.herafy.local`,
            phone: provider.data().phone,
          })
        : null;
    const request: VisibilityRequest = {
      id: requestRef.id,
      providerId,
      type,
      tier: 'paid',
      serviceArea,
      status: 'pending',
      paymentConfirmedBy: null,
      paymentMethod: normalizePaymentMethod(paymentMethod),
      paymentStatus: paymentMethod === 'paymob_card' ? 'requires_action' : 'pending',
      paymentReference: null,
      paymentFailureReason: null,
      paymentSession: paymobSession
        ? {
            provider: 'paymob',
            mode: paymobSession.mode,
            status: 'requires_action',
            checkoutUrl: paymobSession.checkoutUrl,
            merchantOrderId: paymobSession.merchantOrderId,
            integrationId: paymobSession.integrationId,
            orderId: paymobSession.orderId,
            intentionId: null,
            paymentKey: null,
            updatedAt: requestedAt,
          }
        : null,
      productSnapshot,
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
