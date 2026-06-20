import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/db';
import {
  abuseReportConverter,
  adminActionConverter,
  providerConverter,
  providerIdentityDocumentConverter,
  reviewConverter,
} from '@/firebase/converters';
import { nowIso } from '@/lib/dates';
import type { AdminAction } from '@/types/admin';
import type { AdminService, ProviderApplication } from '../contracts/admin.contract';

function firebaseNotImplemented(): never {
  throw new Error('Firebase admin service is not implemented yet. Complete Phase 9 before enabling this admin action.');
}

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
    return snapshot.docs.map((item) => item.data());
  },
  approveProvider: async (adminId, providerId) => {
    const db = requireFirebaseDb();
    const [provider, identity] = await Promise.all([
      getDoc(doc(db, 'providers', providerId).withConverter(providerConverter)),
      getDoc(doc(db, 'providerIdentityDocuments', providerId).withConverter(providerIdentityDocumentConverter)),
    ]);
    if (!provider.exists()) throw new Error('error.provider.notFound');
    if (!identity.exists()) throw new Error('error.provider.identityRequired');
    if (provider.data().status !== 'pending') throw new Error('error.provider.notPending');
    await updateDoc(doc(db, 'providers', providerId), {
      status: 'approved',
      nationalIdVerified: true,
      approvedAt: nowIso(),
      rejectionReason: null,
    });
    await auditLocally(adminId, 'provider', providerId, 'approve_provider', 'admin.reason.identityReviewed');
  },
  rejectProvider: async (adminId, providerId, reason) => {
    const db = requireFirebaseDb();
    const provider = await getDoc(doc(db, 'providers', providerId).withConverter(providerConverter));
    if (!provider.exists()) throw new Error('error.provider.notFound');
    if (provider.data().status !== 'pending') throw new Error('error.provider.notPending');
    await updateDoc(doc(db, 'providers', providerId), {
      status: 'rejected',
      nationalIdVerified: false,
      approvedAt: null,
      rejectionReason: reason,
    });
    await auditLocally(adminId, 'provider', providerId, 'reject_provider', reason);
  },
  suspendProvider: async (adminId, providerId, reason) => {
    const db = requireFirebaseDb();
    const provider = await getDoc(doc(db, 'providers', providerId).withConverter(providerConverter));
    if (!provider.exists()) throw new Error('error.provider.notFound');
    if (provider.data().status === 'suspended') throw new Error('error.provider.alreadySuspended');
    await updateDoc(doc(db, 'providers', providerId), {
      status: 'suspended',
      suspensionReason: reason,
    });
    await auditLocally(adminId, 'provider', providerId, 'suspend_provider', reason);
  },
  approveVisibilityRequest: async () => firebaseNotImplemented(),
  listVisibilityRequests: async () => firebaseNotImplemented(),
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
    return snapshot.docs.map((item) => item.data());
  },
  resolveReport: async (adminId, reportId, reason) => {
    const db = requireFirebaseDb();
    await updateDoc(doc(db, 'reports', reportId), { status: 'closed' });
    await auditLocally(adminId, 'report', reportId, 'resolve_report', reason);
  },
  hideReview: async (adminId, reviewId, reason, reportId) => {
    const db = requireFirebaseDb();
    const review = await getDoc(doc(db, 'reviews', reviewId).withConverter(reviewConverter));
    if (!review.exists()) throw new Error('error.review.notFound');
    await updateDoc(doc(db, 'reviews', reviewId), { status: 'removed' });
    if (reportId) await updateDoc(doc(db, 'reports', reportId), { status: 'closed' });
    await auditLocally(adminId, 'review', reviewId, 'hide_review', reason);
  },
  listProfessions: async () => firebaseNotImplemented(),
};
