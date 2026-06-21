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
import { providerConverter, visibilityRequestConverter } from '@/firebase/converters';
import { nowIso } from '@/lib/dates';
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

export const firebaseVisibilityService: VisibilityService = {
  createVisibilityRequest: async (providerId, serviceArea, paymentMethod, notes) => {
    const db = requireFirebaseDb();
    const provider = await getDoc(doc(db, 'providers', providerId).withConverter(providerConverter));
    if (!provider.exists()) throw new Error('error.provider.notFound');
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
    const request: VisibilityRequest = {
      id: requestRef.id,
      providerId,
      type: isAreaExpansion ? 'area_expansion' : 'boost',
      tier: 'paid',
      serviceArea,
      status: 'pending',
      paymentConfirmedBy: null,
      paymentMethod,
      notes,
      requestedAt: nowIso(),
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
