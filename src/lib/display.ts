import type { AdminTargetType } from '@/types/admin';
import type { ProviderStatus } from '@/types/provider';
import type { RequestStatus } from '@/types/visibility';

type Translate = (key: string) => string;

export function getProviderStatusLabel(
  status: ProviderStatus | null | undefined,
  t: Translate,
) {
  if (!status) return t('status.pending');
  const key: Record<ProviderStatus, string> = {
    pending: 'status.pending',
    approved: 'status.approved',
    suspended: 'status.suspended',
    rejected: 'status.rejected',
  };
  return t(key[status]);
}

export function getVisibilityRequestStatusLabel(
  status: RequestStatus,
  t: Translate,
) {
  const key: Record<RequestStatus, string> = {
    pending: 'status.pending',
    approved: 'status.approved',
    rejected: 'status.rejected',
  };
  return t(key[status]);
}

export function getProfessionActivityLabel(active: boolean, t: Translate) {
  return active ? t('common.active') : t('common.inactive');
}

export function getAdminTargetTypeLabel(
  targetType: AdminTargetType,
  t: Translate,
) {
  const key: Record<AdminTargetType, string> = {
    provider: 'admin.target.provider',
    profession: 'admin.target.profession',
    visibilityRequest: 'admin.target.visibilityRequest',
    review: 'admin.target.review',
    report: 'admin.target.report',
  };
  return t(key[targetType]);
}

export function getAdminActionLabel(action: string, t: Translate) {
  const key = {
    approve_provider: 'admin.action.approveProvider',
    reject_provider: 'admin.action.rejectProvider',
    suspend_provider: 'admin.action.suspendProvider',
    approve_visibility: 'admin.action.approveVisibility',
  }[action];
  return key ? t(key) : action;
}

export function getAdminReasonLabel(reason: string, t: Translate) {
  const key = {
    'Identity information did not pass manual review':
      'admin.reason.identityRejected',
    'Identity reviewed manually': 'admin.reason.identityReviewed',
    'Manual admin suspension': 'admin.reason.manualSuspension',
    'Manual payment confirmed': 'admin.reason.paymentConfirmed',
  }[reason];
  return key ? t(key) : reason;
}
