import { nowIso } from '@/lib/dates';
import type { AbuseReport, AdminAction } from '@/types/admin';
import type {
  Profession,
  ProviderIdentityDocument,
  ProviderProfile,
} from '@/types/provider';
import { createId, readDb, writeDb } from './demo-db';
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
  const db = readDb();
  return db.providers.map((provider) => {
    const user = db.users.find((item) => item.uid === provider.userId);
    return {
      ...provider,
      accountStatus: user?.status ?? 'active',
      banReason: user?.banReason ?? null,
    };
  });
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
  request.paymentStatus = 'matched';
  request.notes = [request.notes, notes].filter(Boolean).join('\n');
  request.processedAt = nowIso();
  if (request.type === 'area_expansion') {
    if (!provider.serviceAreaKeys.includes(request.serviceArea)) {
      provider.serviceAreaKeys.push(request.serviceArea);
      provider.coverageAreaKeys = [...new Set([...provider.coverageAreaKeys, request.serviceArea])].sort();
      provider.serviceAreas.push({ neighborhood: request.serviceArea, city: 'cairo' });
    }
  } else {
    const durationDays = request.productSnapshot?.durationDays ?? 30;
    const now = Date.now();
    provider.visibilityTier = 'paid';
    provider.visibilityPaidUntil = new Date(now + 1000 * 60 * 60 * 24 * durationDays).toISOString();
    provider.paidVisibilityStartedAt = nowIso();
    provider.activeVisibilityRequestId = requestId;
    provider.activeVisibilityProductId = request.productSnapshot?.productId ?? null;
    provider.activeVisibilityProductVersion = request.productSnapshot?.productVersion ?? null;
  }
  db.adminActions.push(audit(adminId, 'visibilityRequest', requestId, 'approve_visibility', notes));
  writeDb(db);
}

export async function rejectVisibilityRequest(adminId: string, requestId: string, reason: string) {
  const db = readDb();
  const request = db.visibilityRequests.find((item) => item.id === requestId);
  if (!request) throw new Error('error.request.notFound');
  if (request.status !== 'pending') throw new Error('error.request.notPending');
  request.status = 'rejected';
  request.paymentStatus = 'rejected';
  request.rejectionReason = reason;
  request.processedAt = nowIso();
  db.adminActions.push(audit(adminId, 'visibilityRequest', requestId, 'reject_visibility', reason));
  writeDb(db);
}

export async function listVisibilityRequests() {
  return readDb().visibilityRequests;
}

export async function listAdminActions() {
  return readDb().adminActions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listReports() {
  const db = readDb();
  return db.reports
    .map((report): AbuseReport => {
      const reporter = db.users.find((item) => item.uid === report.reporterId);
      const provider = report.targetType === 'provider'
        ? db.providers.find((item) => item.id === report.targetId)
        : report.targetType === 'review'
          ? db.providers.find((item) => item.id === db.reviews.find((review) => review.id === report.targetId)?.providerId)
          : null;
      const message = report.targetType === 'message' ? db.messages.find((item) => item.id === report.targetId) : null;
      return {
        ...report,
        reporterName: report.reporterName ?? reporter?.displayName ?? null,
        targetLabel: report.targetLabel ?? provider?.displayName ?? message?.text ?? null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function resolveReport(adminId: string, reportId: string, reason: string) {
  const db = readDb();
  const report = db.reports.find((item) => item.id === reportId);
  if (!report) throw new Error('error.report.notFound');
  report.status = 'closed';
  report.resolvedBy = adminId;
  report.resolvedAt = nowIso();
  report.resolutionReason = reason;
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
    if (report) {
      report.status = 'closed';
      report.resolvedBy = adminId;
      report.resolvedAt = nowIso();
      report.resolutionReason = reason;
    }
  }
  recalculateProviderRating(db, review.providerId);
  db.adminActions.push(audit(adminId, 'review', reviewId, 'hide_review', reason));
  writeDb(db);
}

export async function setUserBanned(adminId: string, userId: string, banned: boolean, reason: string) {
  const db = readDb();
  const user = db.users.find((item) => item.uid === userId);
  if (!user) throw new Error('error.user.notFound');
  user.status = banned ? 'banned' : 'active';
  user.banReason = banned ? reason : null;
  user.bannedAt = banned ? nowIso() : null;
  user.bannedBy = banned ? adminId : null;
  db.adminActions.push(audit(adminId, 'user', userId, banned ? 'ban_user' : 'unban_user', reason));
  writeDb(db);
}

export async function listProfessions(): Promise<Profession[]> {
  return readDb().professions.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveProfession(adminId: string, profession: Profession) {
  const db = readDb();
  const index = db.professions.findIndex((item) => item.id === profession.id);
  if (index >= 0) db.professions[index] = profession;
  else db.professions.push(profession);
  db.adminActions.push(audit(adminId, 'profession', profession.id, index >= 0 ? 'update_profession' : 'create_profession', 'admin.reason.professionUpdated'));
  writeDb(db);
}

export async function setProfessionActive(adminId: string, professionId: string, active: boolean) {
  const db = readDb();
  const profession = db.professions.find((item) => item.id === professionId);
  if (!profession) throw new Error('error.profession.notFound');
  profession.active = active;
  db.adminActions.push(audit(adminId, 'profession', professionId, active ? 'activate_profession' : 'deactivate_profession', 'admin.reason.professionUpdated'));
  writeDb(db);
}
