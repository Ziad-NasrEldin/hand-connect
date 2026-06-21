import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/db';
import { callFirebaseFunction } from '@/firebase/functions';
import {
  abuseReportConverter,
  adminActionConverter,
  professionConverter,
  providerConverter,
  providerIdentityDocumentConverter,
  reviewConverter,
  userConverter,
  visibilityRequestConverter,
} from '@/firebase/converters';
import { nowIso } from '@/lib/dates';
import type { AdminAction } from '@/types/admin';
import type { AdminService, ProviderApplication } from '../contracts/admin.contract';

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

async function auditLocally(adminId: string, targetType: AdminAction['targetType'], targetId: string, action: string, reason: string) {
  const db = requireFirebaseDb();
  const actionRef = doc(collection(db, 'adminActions'), createId('admin-action')).withConverter(adminActionConverter);
  const actionItem: AdminAction = {
    id: actionRef.id,
    adminId,
    targetType,
    targetId,
    action,
    reason,
    createdAt: nowIso(),
  };
  await setDoc(actionRef, actionItem);
}

export const firebaseAdminService: AdminService = {
  getAdminOverview: async () => {
    const db = requireFirebaseDb();
    const [pending, approved, suspended, visibility, reviews] = await Promise.all([
      getDocs(query(collection(db, 'providers'), where('status', '==', 'pending'))),
      getDocs(query(collection(db, 'providers'), where('status', '==', 'approved'))),
      getDocs(query(collection(db, 'providers'), where('status', '==', 'suspended'))),
      getDocs(query(collection(db, 'visibilityRequests'), where('status', '==', 'pending'))),
      getDocs(query(collection(db, 'reviews'), where('status', '==', 'under_review'))),
    ]);
    return {
      pendingApplications: pending.size,
      approvedProviders: approved.size,
      suspendedProviders: suspended.size,
      pendingVisibility: visibility.size,
      reviewsUnderReview: reviews.size,
    };
  },
  listProviderApplications: async () => {
    const db = requireFirebaseDb();
    const providers = await getDocs(
      query(
        collection(db, 'providers').withConverter(providerConverter),
        where('status', '==', 'pending'),
      ),
    );
    const applications = await Promise.all(
      providers.docs.map(async (providerDoc): Promise<ProviderApplication> => {
        const provider = providerDoc.data();
        const identity = await getDoc(
          doc(db, 'providerIdentityDocuments', provider.id).withConverter(providerIdentityDocumentConverter),
        );
        return {
          ...provider,
          identityDocument: identity.exists() ? identity.data() : null,
        };
      }),
    );
    return applications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  listAllProviders: async () => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(collection(db, 'providers').withConverter(providerConverter), orderBy('createdAt', 'desc')),
    );
    const providers = await Promise.all(
      snapshot.docs.map(async (item) => {
        const provider = item.data();
        const user = await getDoc(doc(db, 'users', provider.userId).withConverter(userConverter));
        return {
          ...provider,
          accountStatus: user.data()?.status ?? 'active',
          banReason: user.data()?.banReason ?? null,
        };
      }),
    );
    return providers;
  },
  approveProvider: async (_adminId, providerId) => {
    await callFirebaseFunction<{ providerId: string }, void>('approveProvider', { providerId });
  },
  rejectProvider: async (_adminId, providerId, reason) => {
    await callFirebaseFunction<{ providerId: string; reason: string }, void>('rejectProvider', { providerId, reason });
  },
  suspendProvider: async (_adminId, providerId, reason) => {
    await callFirebaseFunction<{ providerId: string; reason: string }, void>('suspendProvider', { providerId, reason });
  },
  approveVisibilityRequest: async (adminId, requestId, notes) => {
    const db = requireFirebaseDb();
    const requestRef = doc(db, 'visibilityRequests', requestId).withConverter(visibilityRequestConverter);
    const now = new Date();
    const paidUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await runTransaction(db, async (transaction) => {
      const request = await transaction.get(requestRef);
      if (!request.exists()) throw new Error('error.request.notFound');
      if (request.data().status !== 'pending') throw new Error('error.request.notPending');

      const providerRef = doc(db, 'providers', request.data().providerId).withConverter(providerConverter);
      const provider = await transaction.get(providerRef);
      if (!provider.exists()) throw new Error('error.provider.notFound');

      transaction.update(requestRef, {
        status: 'approved',
        paymentConfirmedBy: adminId,
        notes: [request.data().notes, notes].filter(Boolean).join('\n'),
        processedAt: now.toISOString(),
      });
      if (request.data().type === 'area_expansion') {
        const providerData = provider.data();
        if (!providerData.serviceAreaKeys.includes(request.data().serviceArea)) {
          transaction.update(providerRef, {
            serviceAreaKeys: [...providerData.serviceAreaKeys, request.data().serviceArea],
            serviceAreas: [
              ...providerData.serviceAreas,
              { neighborhood: request.data().serviceArea, city: 'cairo' },
            ],
          });
        }
      } else {
        transaction.update(providerRef, {
          visibilityTier: 'paid',
          visibilityPaidUntil: paidUntil,
        });
      }
    });
    await auditLocally(adminId, 'visibilityRequest', requestId, 'approve_visibility', notes);
  },
  rejectVisibilityRequest: async (adminId, requestId, reason) => {
    const db = requireFirebaseDb();
    const requestRef = doc(db, 'visibilityRequests', requestId).withConverter(visibilityRequestConverter);
    const request = await getDoc(requestRef);
    if (!request.exists()) throw new Error('error.request.notFound');
    if (request.data().status !== 'pending') throw new Error('error.request.notPending');

    await updateDoc(requestRef, {
      status: 'rejected',
      rejectionReason: reason,
      processedAt: nowIso(),
    });
    await auditLocally(adminId, 'visibilityRequest', requestId, 'reject_visibility', reason);
  },
  listVisibilityRequests: async () => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(
        collection(db, 'visibilityRequests').withConverter(visibilityRequestConverter),
        orderBy('requestedAt', 'desc'),
      ),
    );
    return snapshot.docs.map((item) => item.data());
  },
  listAdminActions: async () => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(collection(db, 'adminActions').withConverter(adminActionConverter), orderBy('createdAt', 'desc')),
    );
    return snapshot.docs.map((item) => item.data());
  },
  listReports: async () => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(collection(db, 'reports').withConverter(abuseReportConverter), orderBy('createdAt', 'desc')),
    );
    return Promise.all(snapshot.docs.map(async (item) => {
      const report = item.data();
      const [reporter, provider, review] = await Promise.all([
        getDoc(doc(db, 'users', report.reporterId).withConverter(userConverter)),
        report.targetType === 'provider'
          ? getDoc(doc(db, 'providers', report.targetId).withConverter(providerConverter))
          : Promise.resolve(null),
        report.targetType === 'review'
          ? getDoc(doc(db, 'reviews', report.targetId).withConverter(reviewConverter))
          : Promise.resolve(null),
      ]);
      let targetLabel = report.targetLabel ?? null;
      if (!targetLabel && provider?.exists()) targetLabel = provider.data().displayName;
      if (!targetLabel && review?.exists()) {
        const reviewProvider = await getDoc(doc(db, 'providers', review.data().providerId).withConverter(providerConverter));
        targetLabel = reviewProvider.exists() ? reviewProvider.data().displayName : review.data().comment;
      }
      return {
        ...report,
        reporterName: report.reporterName ?? (reporter.exists() ? reporter.data().displayName : null),
        targetLabel,
      };
    }));
  },
  resolveReport: async (adminId, reportId, reason) => {
    const db = requireFirebaseDb();
    await updateDoc(doc(db, 'reports', reportId), {
      status: 'closed',
      resolvedBy: adminId,
      resolvedAt: nowIso(),
      resolutionReason: reason,
    });
    await auditLocally(adminId, 'report', reportId, 'resolve_report', reason);
  },
  hideReview: async (_adminId, reviewId, reason, reportId) => {
    await callFirebaseFunction<{ reviewId: string; reason: string; reportId?: string }, void>('hideReview', {
      reviewId,
      reason,
      reportId,
    });
  },
  setUserBanned: async (adminId, userId, banned, reason) => {
    const db = requireFirebaseDb();
    const userRef = doc(db, 'users', userId).withConverter(userConverter);
    const user = await getDoc(userRef);
    if (!user.exists()) throw new Error('error.user.notFound');
    await updateDoc(userRef, {
      status: banned ? 'banned' : 'active',
      banReason: banned ? reason : null,
      bannedAt: banned ? nowIso() : null,
      bannedBy: banned ? adminId : null,
    });
    await auditLocally(adminId, 'user', userId, banned ? 'ban_user' : 'unban_user', reason);
  },
  listProfessions: async () => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(collection(db, 'professions').withConverter(professionConverter), orderBy('sortOrder', 'asc')),
    );
    return snapshot.docs.map((item) => item.data());
  },
  saveProfession: async (adminId, profession) => {
    const db = requireFirebaseDb();
    const existing = await getDoc(doc(db, 'professions', profession.id));
    await setDoc(doc(db, 'professions', profession.id).withConverter(professionConverter), profession);
    await auditLocally(adminId, 'profession', profession.id, existing.exists() ? 'update_profession' : 'create_profession', 'admin.reason.professionUpdated');
  },
  setProfessionActive: async (adminId, professionId, active) => {
    const db = requireFirebaseDb();
    const professionRef = doc(db, 'professions', professionId).withConverter(professionConverter);
    const profession = await getDoc(professionRef);
    if (!profession.exists()) throw new Error('error.profession.notFound');
    await updateDoc(professionRef, { active });
    await auditLocally(adminId, 'profession', professionId, active ? 'activate_profession' : 'deactivate_profession', 'admin.reason.professionUpdated');
  },
};
