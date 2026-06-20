import { nowIso } from '@/lib/dates';
import type { AdminAction } from '@/types/admin';
import type {
  Profession,
  ProviderIdentityDocument,
  ProviderProfile,
} from '@/types/provider';
import { activeProfessions, createId, readDb, writeDb } from './demo-db';
import { recalculateProviderRating } from './reviews.demo';

export type ProviderApplication = ProviderProfile & {
  identityDocument: ProviderIdentityDocument | null;
};

function audit(adminId: string, targetType: AdminAction['targetType'], targetId: string, action: string, reason: string) {
  return {
    id: createId('admin-action'),
    adminId,
    targetType,
    targetId,
    action,
    reason,
    createdAt: nowIso(),
  };
}

export async function getAdminOverview() {
  const db = readDb();
  return {
    pendingApplications: db.providers.filter((item) => item.status === 'pending').length,
    approvedProviders: db.providers.filter((item) => item.status === 'approved').length,
    suspendedProviders: db.providers.filter((item) => item.status === 'suspended').length,
    pendingVisibility: db.visibilityRequests.filter((item) => item.status === 'pending').length,
    reviewsUnderReview: db.reviews.filter((item) => item.status === 'under_review').length,
  };
}

export async function listProviderApplications() {
  const db = readDb();
  return db.providers
    .filter((item) => item.status === 'pending')
    .map(
      (provider): ProviderApplication => ({
        ...provider,
        identityDocument:
          db.identityDocuments.find((item) => item.providerId === provider.id) ??
          null,
      }),
    );
}

export async function listAllProviders() {
  return readDb().providers;
}

export async function approveProvider(adminId: string, providerId: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('error.provider.notFound');
  if (!db.identityDocuments.some((item) => item.providerId === providerId))
    throw new Error('error.provider.identityRequired');
  provider.status = 'approved';
  provider.nationalIdVerified = true;
  provider.approvedAt = nowIso();
  db.adminActions.push(
    audit(
      adminId,
      'provider',
      providerId,
      'approve_provider',
      'admin.reason.identityReviewed',
    ),
  );
  writeDb(db);
}

export async function rejectProvider(adminId: string, providerId: string, reason: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('error.provider.notFound');
  provider.status = 'rejected';
  provider.rejectionReason = reason;
  db.adminActions.push(audit(adminId, 'provider', providerId, 'reject_provider', reason));
  writeDb(db);
}

export async function suspendProvider(adminId: string, providerId: string, reason: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('error.provider.notFound');
  provider.status = 'suspended';
  db.adminActions.push(audit(adminId, 'provider', providerId, 'suspend_provider', reason));
  writeDb(db);
}

export async function approveVisibilityRequest(adminId: string, requestId: string, notes: string) {
  const db = readDb();
  const request = db.visibilityRequests.find((item) => item.id === requestId);
  if (!request) throw new Error('error.request.notFound');
  const provider = db.providers.find((item) => item.id === request.providerId);
  if (!provider) throw new Error('error.provider.notFound');
  request.status = 'approved';
  request.paymentConfirmedBy = adminId;
  request.notes = [request.notes, notes].filter(Boolean).join('\n');
  request.processedAt = nowIso();
  provider.visibilityTier = 'paid';
  provider.visibilityPaidUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  db.adminActions.push(audit(adminId, 'visibilityRequest', requestId, 'approve_visibility', notes));
  writeDb(db);
}

export async function listVisibilityRequests() {
  return readDb().visibilityRequests;
}

export async function listAdminActions() {
  return readDb().adminActions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listReports() {
  return readDb().reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function resolveReport(adminId: string, reportId: string, reason: string) {
  const db = readDb();
  const report = db.reports.find((item) => item.id === reportId);
  if (!report) throw new Error('error.report.notFound');
  report.status = 'closed';
  db.adminActions.push(audit(adminId, 'report', reportId, 'resolve_report', reason));
  writeDb(db);
}

export async function hideReview(adminId: string, reviewId: string, reason: string, reportId?: string) {
  const db = readDb();
  const review = db.reviews.find((item) => item.id === reviewId);
  if (!review) throw new Error('error.review.notFound');
  review.status = 'removed';
  if (reportId) {
    const report = db.reports.find((item) => item.id === reportId);
    if (report) report.status = 'closed';
  }
  recalculateProviderRating(db, review.providerId);
  db.adminActions.push(audit(adminId, 'review', reviewId, 'hide_review', reason));
  writeDb(db);
}

export async function listProfessions(): Promise<Profession[]> {
  return activeProfessions();
}
