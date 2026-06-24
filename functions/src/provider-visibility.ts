import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export interface PublicProviderRecord {
  userId?: string;
  status?: string;
}

export async function ownerIsActive(firestore: Firestore, userId: string) {
  const owner = await firestore.collection('users').doc(userId).get();
  return owner.exists && owner.data()?.status !== 'banned';
}

export async function requirePublicApprovedProvider(firestore: Firestore, providerId: string) {
  const provider = await firestore.collection('providers').doc(providerId).get();
  const data = provider.data() as PublicProviderRecord | undefined;
  if (!provider.exists || data?.status !== 'approved' || !data.userId || !(await ownerIsActive(firestore, data.userId))) {
    throw new HttpsError('not-found', 'Provider not found.');
  }
  return provider;
}

export async function requirePublicApprovedProviderInTransaction(
  transaction: Transaction,
  firestore: Firestore,
  providerId: string,
) {
  const providerRef = firestore.collection('providers').doc(providerId);
  const provider = await transaction.get(providerRef);
  const data = provider.data() as PublicProviderRecord | undefined;
  if (!provider.exists || data?.status !== 'approved' || !data.userId) {
    throw new HttpsError('not-found', 'Provider is not available.');
  }
  const owner = await transaction.get(firestore.collection('users').doc(data.userId));
  if (!owner.exists || owner.data()?.status === 'banned') {
    throw new HttpsError('not-found', 'Provider is not available.');
  }
  return { providerRef, provider };
}
