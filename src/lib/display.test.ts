import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import {
  getAdminReasonLabel,
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
