import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import {
  getAdminActionLabel,
  getAdminReasonLabel,
  getAdminTargetTypeLabel,
  getLocalizedMessage,
  getReportReasonLabel,
  getVisibilityRequestNoteLabel,
} from './display';

const t = (key: string) => en[key as keyof typeof en] ?? key;

describe('display helpers', () => {
  it('translates admin reasons from keys and legacy text', () => {
    expect(getAdminReasonLabel('admin.reason.identityReviewed', t)).toBe(
      en['admin.reason.identityReviewed'],
    );
    expect(getAdminReasonLabel('Identity reviewed manually.', t)).toBe(
      en['admin.reason.identityReviewed'],
    );
  });

  it('translates admin audit targets and actions', () => {
    expect(getAdminTargetTypeLabel('user', t)).toBe(en['admin.target.user']);
    expect(getAdminActionLabel('resolve_report', t)).toBe(en['admin.action.resolveReport']);
    expect(getAdminActionLabel('hide_review', t)).toBe(en['admin.action.hideReview']);
    expect(getAdminActionLabel('ban_user', t)).toBe(en['admin.action.banUser']);
    expect(getAdminActionLabel('unban_user', t)).toBe(en['admin.action.unbanUser']);
  });

  it('translates system visibility notes line by line', () => {
    expect(
      getVisibilityRequestNoteLabel(
        'visibility.note.walletTransferPending\nadmin.reason.paymentConfirmed',
        t,
      ),
    ).toBe(
      `${en['visibility.note.walletTransferPending']}\n${en['admin.reason.paymentConfirmed']}`,
    );
    expect(
      getVisibilityRequestNoteLabel('Admin: Manual payment confirmed', t),
    ).toBe(
      `${en['visibility.adminNotePrefix']}: ${en['admin.reason.paymentConfirmed']}`,
    );
  });

  it('translates report reasons and error keys', () => {
    expect(
      getReportReasonLabel(
        'Customer reported repeated rescheduling after contact.',
        t,
      ),
    ).toBe(en['report.reason.repeatedReschedulingAfterContact']);
    expect(getLocalizedMessage('error.auth.invalidCredentials', t)).toBe(
      en['error.auth.invalidCredentials'],
    );
    expect(getLocalizedMessage('Plain text', t)).toBe('Plain text');
  });
});
