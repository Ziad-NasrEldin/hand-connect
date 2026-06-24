import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { requirePublicApprovedProviderInTransaction } from './provider-visibility.js';

export type AnalyticsEventType =
  | 'profile_view'
  | 'chat_initiated'
  | 'whatsapp_reveal'
  | 'review_created'
  | 'review_moderated'
  | 'provider_status_changed'
  | 'paid_visibility_started'
  | 'paid_visibility_expired'
  | 'area_expansion_approved';

export interface AnalyticsEventInput {
  type: AnalyticsEventType;
  actorId: string | null;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string | number | boolean | null>;
  dedupeKey?: string;
  createdAt: string;
}

function ensureApp() {
  if (!getApps().length) initializeApp();
}

function db() {
  ensureApp();
  return getFirestore();
}

function requireProviderId(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', 'providerId is required.');
  }
  return value.trim();
}

function readDedupeKey(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 160);
}

export function writeAnalyticsEvent(
  transaction: Transaction,
  firestore: Firestore,
  input: AnalyticsEventInput,
) {
  const eventRef = input.dedupeKey
    ? firestore.collection('analyticsEvents').doc(input.dedupeKey)
    : firestore.collection('analyticsEvents').doc();
  transaction.set(eventRef, input, { merge: false });
}

export const trackProfileView = onCall(async (request) => {
  const providerId = requireProviderId(request.data?.providerId);
  const actorId = request.auth?.uid ?? null;
  const dedupeKey = readDedupeKey(request.data?.dedupeKey);
  const firestore = db();

  await firestore.runTransaction(async (transaction) => {
    const { providerRef, provider } = await requirePublicApprovedProviderInTransaction(transaction, firestore, providerId);
    if (actorId && provider.data()?.userId === actorId) return;
    if (dedupeKey) {
      const existingEvent = await transaction.get(firestore.collection('analyticsEvents').doc(dedupeKey));
      if (existingEvent.exists) return;
    }
    const createdAt = new Date().toISOString();
    transaction.update(providerRef, {
      profileViews: Number(provider.data()?.profileViews ?? 0) + 1,
    });
    writeAnalyticsEvent(transaction, firestore, {
      type: 'profile_view',
      actorId,
      targetType: 'provider',
      targetId: providerId,
      metadata: { source: 'profile' },
      dedupeKey: dedupeKey || undefined,
      createdAt,
    });
  });
});
