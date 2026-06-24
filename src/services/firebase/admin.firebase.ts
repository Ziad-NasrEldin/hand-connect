import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  writeBatch,
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
import type { AdminService, ProviderApplication } from '../contracts/admin.contract';

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
}

async function approveProviderDirectly(adminId: string, providerId: string) {
  const db = requireFirebaseDb();
  const providerRef = doc(db, 'providers', providerId);
  const identityRef = doc(db, 'providerIdentityDocuments', providerId);
  const [provider, identity] = await Promise.all([
    getDoc(providerRef),
    getDoc(identityRef),
  ]);

  if (!provider.exists()) throw new Error('error.provider.notFound');
  if (!identity.exists()) throw new Error('error.provider.identityRequired');
  if (provider.data().status !== 'pending') throw new Error('error.request.notPending');

  const now = new Date().toISOString();
  const batch = writeBatch(db);
  batch.update(providerRef, {
    status: 'approved',
    nationalIdVerified: true,
    approvedAt: now,
    rejectionReason: null,
    verificationStatus: 'verified',
    verificationReviewedAt: now,
    verificationReviewedBy: adminId,
  });
  batch.set(doc(collection(db, 'adminActions')), {
    adminId,
    targetType: 'provider',
    targetId: providerId,
    action: 'approve_provider',
    reason: 'admin.reason.identityReviewed',
    createdAt: now,
  });
  await batch.commit();
}

async function rejectProviderDirectly(
  adminId: string,
  providerId: string,
  reason: string,
) {
  const db = requireFirebaseDb();
  const providerRef = doc(db, 'providers', providerId);
  const provider = await getDoc(providerRef);

  if (!provider.exists()) throw new Error('error.provider.notFound');
  if (provider.data().status !== 'pending') throw new Error('error.request.notPending');

  const now = new Date().toISOString();
  const batch = writeBatch(db);
  batch.update(providerRef, {
    status: 'rejected',
    nationalIdVerified: false,
    approvedAt: null,
    rejectionReason: reason,
    verificationStatus: 'rejected',
    verificationReviewedAt: now,
    verificationReviewedBy: adminId,
  });
  batch.set(doc(collection(db, 'adminActions')), {
    adminId,
    targetType: 'provider',
    targetId: providerId,
    action: 'reject_provider',
    reason,
    createdAt: now,
  });
  await batch.commit();
}

async function suspendProviderDirectly(
  adminId: string,
  providerId: string,
  reason: string,
) {
  const db = requireFirebaseDb();
  const providerRef = doc(db, 'providers', providerId);
  const provider = await getDoc(providerRef);

  if (!provider.exists()) throw new Error('error.provider.notFound');
  if (provider.data().status === 'suspended') throw new Error('error.request.notPending');

  const now = new Date().toISOString();
  const batch = writeBatch(db);
  batch.update(providerRef, {
    status: 'suspended',
    suspensionReason: reason,
  });
  batch.set(doc(collection(db, 'adminActions')), {
    adminId,
    targetType: 'provider',
    targetId: providerId,
    action: 'suspend_provider',
    reason,
    createdAt: now,
  });
  await batch.commit();
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
  approveProvider: async (adminId, providerId) => {
    await approveProviderDirectly(adminId, providerId);
  },
  rejectProvider: async (adminId, providerId, reason) => {
    await rejectProviderDirectly(adminId, providerId, reason);
  },
  suspendProvider: async (adminId, providerId, reason) => {
    await suspendProviderDirectly(adminId, providerId, reason);
  },
  approveVisibilityRequest: async (_adminId, requestId, notes) => {
    await callFirebaseFunction<{ requestId: string; notes: string }, void>('approveVisibilityRequest', { requestId, notes });
  },
  rejectVisibilityRequest: async (_adminId, requestId, reason) => {
    await callFirebaseFunction<{ requestId: string; reason: string }, void>('rejectVisibilityRequest', { requestId, reason });
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
  resolveReport: async (_adminId, reportId, reason) => {
    await callFirebaseFunction<{ reportId: string; reason: string }, void>('resolveReport', { reportId, reason });
  },
  hideReview: async (_adminId, reviewId, reason, reportId) => {
    await callFirebaseFunction<{ reviewId: string; reason: string; reportId?: string }, void>('hideReview', {
      reviewId,
      reason,
      reportId,
    });
  },
  setUserBanned: async (_adminId, userId, banned, reason) => {
    await callFirebaseFunction<{ userId: string; banned: boolean; reason: string }, void>('setUserBanned', {
      userId,
      banned,
      reason,
    });
  },
  listProfessions: async () => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(collection(db, 'professions').withConverter(professionConverter), orderBy('sortOrder', 'asc')),
    );
    return snapshot.docs.map((item) => item.data());
  },
  saveProfession: async (_adminId, profession) => {
    await callFirebaseFunction<{ profession: typeof profession }, void>('saveProfession', { profession });
  },
  setProfessionActive: async (_adminId, professionId, active) => {
    await callFirebaseFunction<{ professionId: string; active: boolean }, void>('setProfessionActive', {
      professionId,
      active,
    });
  },
};
