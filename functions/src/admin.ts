import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { writeAudit } from './audit.js';

interface UserRecord {
  role?: string;
  status?: string;
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
  if (!trimmed || trimmed.length > maxLength) throw new HttpsError('invalid-argument', `${field} is invalid.`);
  return trimmed;
}

function readBoolean(value: unknown, field: string) {
  if (typeof value !== 'boolean') throw new HttpsError('invalid-argument', `${field} is required.`);
  return value;
}

function readNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new HttpsError('invalid-argument', `${field} is required.`);
  }
  return value;
}

async function requireAdmin(firestore: Firestore, uid: string) {
  const user = await firestore.collection('users').doc(uid).get();
  const data = user.data() as UserRecord | undefined;
  if (!user.exists || data?.role !== 'admin' || data.status === 'banned') {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
}

export function professionPayload(data: unknown) {
  if (!data || typeof data !== 'object') throw new HttpsError('invalid-argument', 'profession is required.');
  const input = data as Record<string, unknown>;
  return {
    id: readString(input.id, 'profession.id', 120),
    slug: readString(input.slug, 'profession.slug', 120),
    nameAr: readString(input.nameAr, 'profession.nameAr', 120),
    nameEn: readString(input.nameEn, 'profession.nameEn', 120),
    icon: readString(input.icon, 'profession.icon', 80),
    active: readBoolean(input.active, 'profession.active'),
    sortOrder: readNumber(input.sortOrder, 'profession.sortOrder'),
  };
}

export const resolveReport = onCall(async (request) => {
  const adminId = requireAuth(request);
  const reportId = readString(request.data?.reportId, 'reportId', 120);
  const reason = readString(request.data?.reason, 'reason', 1000);
  const firestore = db();
  await requireAdmin(firestore, adminId);
  await firestore.runTransaction(async (transaction) => {
    const reportRef = firestore.collection('reports').doc(reportId);
    const report = await transaction.get(reportRef);
    if (!report.exists) throw new HttpsError('not-found', 'Report not found.');
    const timestamp = new Date().toISOString();
    transaction.update(reportRef, {
      status: 'closed',
      resolvedBy: adminId,
      resolvedAt: timestamp,
      resolutionReason: reason,
    });
    writeAudit(transaction, firestore, {
      adminId,
      targetType: 'report',
      targetId: reportId,
      action: 'resolve_report',
      reason,
      createdAt: timestamp,
    });
  });
});

export const setUserBanned = onCall(async (request) => {
  const adminId = requireAuth(request);
  const userId = readString(request.data?.userId, 'userId', 120);
  const banned = readBoolean(request.data?.banned, 'banned');
  const reason = readString(request.data?.reason, 'reason', 1000);
  const firestore = db();
  await requireAdmin(firestore, adminId);
  const providerSnapshots = await firestore.collection('providers').where('userId', '==', userId).get();
  await firestore.runTransaction(async (transaction) => {
    const userRef = firestore.collection('users').doc(userId);
    const user = await transaction.get(userRef);
    if (!user.exists) throw new HttpsError('not-found', 'User not found.');
    const timestamp = new Date().toISOString();
    transaction.update(userRef, {
      status: banned ? 'banned' : 'active',
      banReason: banned ? reason : null,
      bannedAt: banned ? timestamp : null,
      bannedBy: banned ? adminId : null,
    });
    providerSnapshots.docs.forEach((provider) => {
      transaction.update(provider.ref, { ownerStatus: banned ? 'banned' : 'active' });
    });
    writeAudit(transaction, firestore, {
      adminId,
      targetType: 'user',
      targetId: userId,
      action: banned ? 'ban_user' : 'unban_user',
      reason,
      createdAt: timestamp,
    });
  });
});

export const saveProfession = onCall(async (request) => {
  const adminId = requireAuth(request);
  const profession = professionPayload(request.data?.profession);
  const firestore = db();
  await requireAdmin(firestore, adminId);
  await firestore.runTransaction(async (transaction) => {
    const professionRef = firestore.collection('professions').doc(profession.id);
    const existing = await transaction.get(professionRef);
    const timestamp = new Date().toISOString();
    transaction.set(professionRef, profession);
    writeAudit(transaction, firestore, {
      adminId,
      targetType: 'profession',
      targetId: profession.id,
      action: existing.exists ? 'update_profession' : 'create_profession',
      reason: 'admin.reason.professionUpdated',
      createdAt: timestamp,
    });
  });
});

export const setProfessionActive = onCall(async (request) => {
  const adminId = requireAuth(request);
  const professionId = readString(request.data?.professionId, 'professionId', 120);
  const active = readBoolean(request.data?.active, 'active');
  const firestore = db();
  await requireAdmin(firestore, adminId);
  await firestore.runTransaction(async (transaction) => {
    const professionRef = firestore.collection('professions').doc(professionId);
    const profession = await transaction.get(professionRef);
    if (!profession.exists) throw new HttpsError('not-found', 'Profession not found.');
    const timestamp = new Date().toISOString();
    transaction.update(professionRef, { active });
    writeAudit(transaction, firestore, {
      adminId,
      targetType: 'profession',
      targetId: professionId,
      action: active ? 'activate_profession' : 'deactivate_profession',
      reason: 'admin.reason.professionUpdated',
      createdAt: timestamp,
    });
  });
});
