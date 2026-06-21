import type { AdminTargetType } from '@/types/admin';
import type { ProviderStatus } from '@/types/provider';
import type { RequestStatus } from '@/types/visibility';

type Translate = (key: string) => string;

const adminReasonKeyByLegacyValue: Record<string, string> = {
  'identity information did not pass manual review':
    'admin.reason.identityRejected',
  'identity reviewed manually': 'admin.reason.identityReviewed',
  'manual admin suspension': 'admin.reason.manualSuspension',
  'manual payment confirmed': 'admin.reason.paymentConfirmed',
  'repeated report pending manual review':
    'admin.reason.repeatedReportPendingManualReview',
};

const visibilityNoteKeyByLegacyValue: Record<string, string> = {
  'manual cash payment confirmed for featured new cairo exposure':
    'visibility.note.manualCashPaymentConfirmed',
  'provider says wallet transfer will be sent today':
    'visibility.note.walletTransferPending',
};

const reportReasonKeyByLegacyValue: Record<string, string> = {
  'customer reported repeated rescheduling after contact':
    'report.reason.repeatedReschedulingAfterContact',
};

function normalizeLegacyValue(value: string) {
  return value.trim().replace(/[.]+$/, '').toLowerCase();
}

function isTranslationKey(value: string) {
  return /^[a-z]+(?:\.[A-Za-z0-9]+)+$/.test(value.trim());
}

function translateMappedValue(
  value: string,
  prefix: string,
  legacyKeyByValue: Record<string, string>,
  t: Translate,
) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith(prefix)) return t(trimmed);
  const key = legacyKeyByValue[normalizeLegacyValue(trimmed)];
  return key ? t(key) : trimmed;
}

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
    user: 'admin.target.user',
  };
  return t(key[targetType]);
}

export function getAdminActionLabel(action: string, t: Translate) {
  const key = {
    approve_provider: 'admin.action.approveProvider',
    reject_provider: 'admin.action.rejectProvider',
    suspend_provider: 'admin.action.suspendProvider',
    approve_visibility: 'admin.action.approveVisibility',
    reject_visibility: 'admin.action.rejectVisibility',
    flag_review: 'admin.action.flagReview',
    resolve_report: 'admin.action.resolveReport',
    hide_review: 'admin.action.hideReview',
    create_profession: 'admin.action.createProfession',
    update_profession: 'admin.action.updateProfession',
    activate_profession: 'admin.action.activateProfession',
    deactivate_profession: 'admin.action.deactivateProfession',
    ban_user: 'admin.action.banUser',
    unban_user: 'admin.action.unbanUser',
  }[action];
  return key ? t(key) : action;
}

export function getAdminReasonLabel(reason: string, t: Translate) {
  return translateMappedValue(
    reason,
    'admin.reason.',
    adminReasonKeyByLegacyValue,
    t,
  );
}

export function getVisibilityRequestNoteLabel(
  notes: string,
  t: Translate,
): string {
  return notes
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return trimmed;

      if (/^Admin:\s*/i.test(trimmed)) {
        const note = trimmed.replace(/^Admin:\s*/i, '');
        return `${t('visibility.adminNotePrefix')}: ${getVisibilityRequestNoteLabel(note, t)}`;
      }

      const visibilityNote = translateMappedValue(
        trimmed,
        'visibility.note.',
        visibilityNoteKeyByLegacyValue,
        t,
      );
      if (visibilityNote !== trimmed) return visibilityNote;

      return getAdminReasonLabel(trimmed, t);
    })
    .join('\n');
}

export function getReportReasonLabel(reason: string, t: Translate) {
  return translateMappedValue(
    reason,
    'report.reason.',
    reportReasonKeyByLegacyValue,
    t,
  );
}

export function getLocalizedMessage(message: string, t: Translate) {
  return isTranslationKey(message) ? t(message) : message;
}
