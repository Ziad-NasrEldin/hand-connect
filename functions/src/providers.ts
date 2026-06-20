import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

type ProviderStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

interface ProviderRecord {
  status: ProviderStatus;
  nationalIdVerified: boolean;
  approvedAt: string | null;
  rejectionReason?: string;
}

function ensureApp() {
  if (!getApps().length) initializeApp();
}

function db() {
  ensureApp();
  return getFirestore();
}

function requireAuth(context: { auth?: { uid: string } }) {
  const uid = context.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in is required.');
  return uid;
}

function readString(value: unknown, field: string, maxLength = 1000) {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `${field} is required.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`);
  }
  return trimmed;
}

async function requireAdmin(firestore: Firestore, uid: string) {
  const user = await firestore.collection('users').doc(uid).get();
  if (user.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
}

export function approvedProviderPatch(now = new Date().toISOString()) {
  return {
    status: 'approved' as const,
    nationalIdVerified: true,
    approvedAt: now,
    rejectionReason: null,
  };
}

export function rejectedProviderPatch(reason: string) {
  return {
    status: 'rejected' as const,
    nationalIdVerified: false,
    approvedAt: null,
    rejectionReason: reason,
  };
}

export function suspendedProviderPatch(reason: string) {
  return {
    status: 'suspended' as const,
    suspensionReason: reason,
  };
}

export const approveProvider = onCall(async (request) => {
  const adminId = requireAuth(request);
  const providerId = readString(request.data?.providerId, 'providerId', 120);
  const firestore = db();
  await requireAdmin(firestore, adminId);

  await firestore.runTransaction(async (transaction) => {
    const providerRef = firestore.collection('providers').doc(providerId);
    const identityRef = firestore.collection('providerIdentityDocuments').doc(providerId);
    const provider = await transaction.get(providerRef);
    const identity = await transaction.get(identityRef);
    if (!provider.exists) throw new HttpsError('not-found', 'Provider not found.');
    if (!identity.exists) throw new HttpsError('failed-precondition', 'Identity document is required.');
    if ((provider.data() as ProviderRecord).status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Only pending providers can be approved.');
    }

    transaction.update(providerRef, approvedProviderPatch());
    transaction.set(firestore.collection('adminActions').doc(), {
      adminId,
      targetType: 'provider',
      targetId: providerId,
      action: 'approve_provider',
      reason: 'admin.reason.identityReviewed',
      createdAt: new Date().toISOString(),
    });
  });
});

export const rejectProvider = onCall(async (request) => {
  const adminId = requireAuth(request);
  const providerId = readString(request.data?.providerId, 'providerId', 120);
  const reason = readString(request.data?.reason, 'reason', 1000);
  const firestore = db();
  await requireAdmin(firestore, adminId);

  await firestore.runTransaction(async (transaction) => {
    const providerRef = firestore.collection('providers').doc(providerId);
    const provider = await transaction.get(providerRef);
    if (!provider.exists) throw new HttpsError('not-found', 'Provider not found.');
    if ((provider.data() as ProviderRecord).status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Only pending providers can be rejected.');
    }

    transaction.update(providerRef, rejectedProviderPatch(reason));
    transaction.set(firestore.collection('adminActions').doc(), {
      adminId,
      targetType: 'provider',
      targetId: providerId,
      action: 'reject_provider',
      reason,
      createdAt: new Date().toISOString(),
    });
  });
});

export const suspendProvider = onCall(async (request) => {
  const adminId = requireAuth(request);
  const providerId = readString(request.data?.providerId, 'providerId', 120);
  const reason = readString(request.data?.reason, 'reason', 1000);
  const firestore = db();
  await requireAdmin(firestore, adminId);

  await firestore.runTransaction(async (transaction) => {
    const providerRef = firestore.collection('providers').doc(providerId);
    const provider = await transaction.get(providerRef);
    if (!provider.exists) throw new HttpsError('not-found', 'Provider not found.');
    if ((provider.data() as ProviderRecord).status === 'suspended') {
      throw new HttpsError('failed-precondition', 'Provider is already suspended.');
    }

    transaction.update(providerRef, suspendedProviderPatch(reason));
    transaction.set(firestore.collection('adminActions').doc(), {
      adminId,
      targetType: 'provider',
      targetId: providerId,
      action: 'suspend_provider',
      reason,
      createdAt: new Date().toISOString(),
    });
  });
});
