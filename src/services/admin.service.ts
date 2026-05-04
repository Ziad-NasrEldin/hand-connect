import { nowIso } from '@/lib/dates';
import type { AdminAction } from '@/types/admin';
import type { Profession } from '@/types/provider';
import { activeProfessions, createId, readDb, writeDb } from './demo-db';

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
  return readDb().providers.filter((item) => item.status === 'pending');
}

export async function listAllProviders() {
  return readDb().providers;
}

export async function approveProvider(adminId: string, providerId: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('Provider not found');
  provider.status = 'approved';
  provider.nationalIdVerified = true;
  provider.approvedAt = nowIso();
  db.adminActions.push(audit(adminId, 'provider', providerId, 'approve_provider', 'Identity reviewed manually'));
  writeDb(db);
}

export async function rejectProvider(adminId: string, providerId: string, reason: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('Provider not found');
  provider.status = 'rejected';
  provider.rejectionReason = reason;
  db.adminActions.push(audit(adminId, 'provider', providerId, 'reject_provider', reason));
  writeDb(db);
}

export async function suspendProvider(adminId: string, providerId: string, reason: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('Provider not found');
  provider.status = 'suspended';
  db.adminActions.push(audit(adminId, 'provider', providerId, 'suspend_provider', reason));
  writeDb(db);
}

export async function approveVisibilityRequest(adminId: string, requestId: string, notes: string) {
  const db = readDb();
  const request = db.visibilityRequests.find((item) => item.id === requestId);
  if (!request) throw new Error('Request not found');
  const provider = db.providers.find((item) => item.id === request.providerId);
  if (!provider) throw new Error('Provider not found');
  request.status = 'approved';
  request.paymentConfirmedBy = adminId;
  request.notes = `${request.notes}\nAdmin: ${notes}`.trim();
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
  return readDb().reports;
}

export async function listProfessions(): Promise<Profession[]> {
  return activeProfessions();
}
