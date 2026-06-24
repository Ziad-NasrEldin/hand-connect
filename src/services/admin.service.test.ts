import { beforeEach, describe, expect, it, vi } from 'vitest';
import { login } from './auth.service';
import {
  approveProvider,
  approveVisibilityRequest,
  hideReview,
  listAdminActions,
  listAllProviders,
  listProfessions,
  listReports,
  rejectProvider,
  rejectVisibilityRequest,
  resolveReport,
  saveProfession,
  setProfessionActive,
  setUserBanned,
  suspendProvider,
} from './admin.service';
import { readDb, resetDemoDb, writeDb } from './demo/demo-db';

describe('admin service professions', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    resetDemoDb();
  });

  it('saves professions and toggles active status', async () => {
    await saveProfession('admin-demo', {
      id: 'painting',
      slug: 'painting',
      nameAr: 'دهان',
      nameEn: 'Painting',
      icon: 'Brush',
      active: true,
      sortOrder: 99,
    });

    expect((await listProfessions()).find((item) => item.id === 'painting')).toMatchObject({
      active: true,
      nameEn: 'Painting',
    });

    await setProfessionActive('admin-demo', 'painting', false);

    expect((await listProfessions()).find((item) => item.id === 'painting')).toMatchObject({
      active: false,
    });
  });
});

describe('admin service account bans', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    resetDemoDb();
  });

  it('bans and unbans provider accounts with audit entries', async () => {
    await setUserBanned('admin-demo', 'provider-demo', true, 'admin.reason.manualBan');

    expect((await listAllProviders()).find((item) => item.id === 'provider-demo')).toMatchObject({
      accountStatus: 'banned',
      ownerStatus: 'banned',
      banReason: 'admin.reason.manualBan',
    });
    await expect(login('provider@hand.test', 'password')).rejects.toThrow('error.auth.accountBanned');

    await setUserBanned('admin-demo', 'provider-demo', false, 'admin.reason.manualUnban');

    expect((await listAllProviders()).find((item) => item.id === 'provider-demo')).toMatchObject({
      accountStatus: 'active',
      ownerStatus: 'active',
      banReason: null,
    });
    await expect(login('provider@hand.test', 'password')).resolves.toMatchObject({
      user: { uid: 'provider-demo' },
    });
  });
});

describe('admin service reports workflow', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    resetDemoDb();
  });

  it('shows target context and stores resolution metadata', async () => {
    const openReport = (await listReports()).find((item) => item.id === 'report-1');

    expect(openReport).toMatchObject({
      targetType: 'provider',
      targetId: 'provider-suspended',
      targetLabel: 'ورشة تحت المراجعة',
      reporterName: 'عمر محمود',
      status: 'open',
    });

    await resolveReport('admin-demo', 'report-1', 'admin.reason.reportResolved');

    expect((await listReports()).find((item) => item.id === 'report-1')).toMatchObject({
      status: 'closed',
      resolvedBy: 'admin-demo',
      resolutionReason: 'admin.reason.reportResolved',
    });
    expect((await listReports()).find((item) => item.id === 'report-1')?.resolvedAt).toBeTruthy();
  });
});

describe('admin service audit coverage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    resetDemoDb();
  });

  it('records audit rows for each admin mutation', async () => {
    const db = readDb();
    db.visibilityRequests.push({
      id: 'visibility-reject-audit',
      providerId: 'provider-demo',
      type: 'boost',
      tier: 'paid',
      serviceArea: 'new-cairo',
      status: 'pending',
      paymentConfirmedBy: null,
      paymentMethod: 'manual_wallet',
      paymentStatus: 'pending',
      paymentReference: null,
      productSnapshot: {
        productId: 'visibility_boost_30_paymob',
        productVersion: 2,
        productType: 'visibility_boost',
        durationDays: 30,
        priceAmount: 500,
        currency: 'EGP',
        billingModel: 'pay_as_you_go',
        capPolicy: 'none',
        paymentProvider: 'paymob',
        renewalPolicy: 'none',
        snapshotAt: '2026-05-04T08:00:00.000Z',
      },
      disclosureVersion: 'visibility-no-guarantee-v1',
      disclosureAcceptedAt: '2026-05-04T08:00:00.000Z',
      notes: 'visibility.note.walletTransferPending',
      requestedAt: '2026-05-04T08:00:00.000Z',
      processedAt: null,
    });
    writeDb(db);

    await approveProvider('admin-demo', 'provider-pending');
    await rejectProvider('admin-demo', 'provider-rejected', 'admin.reason.identityRejected');
    await suspendProvider('admin-demo', 'provider-demo', 'admin.reason.manualSuspension');
    await approveVisibilityRequest('admin-demo', 'visibility-carpenter-heliopolis', 'admin.reason.paymentConfirmed');
    await rejectVisibilityRequest('admin-demo', 'visibility-reject-audit', 'admin.reason.paymentCouldNotBeMatched');
    await resolveReport('admin-demo', 'report-1', 'admin.reason.reportResolved');
    await hideReview('admin-demo', 'review-6', 'admin.reason.reviewHidden', 'report-3');
    await setUserBanned('admin-demo', 'provider-demo', true, 'admin.reason.manualBan');
    await setUserBanned('admin-demo', 'provider-demo', false, 'admin.reason.manualUnban');
    await saveProfession('admin-demo', {
      id: 'painting',
      slug: 'painting',
      nameAr: 'دهان',
      nameEn: 'Painting',
      icon: 'Brush',
      active: true,
      sortOrder: 99,
    });
    await setProfessionActive('admin-demo', 'painting', false);

    const actions = (await listAdminActions()).map((item) => item.action);

    expect(actions).toEqual(expect.arrayContaining([
      'approve_provider',
      'reject_provider',
      'suspend_provider',
      'approve_visibility',
      'reject_visibility',
      'resolve_report',
      'hide_review',
      'ban_user',
      'unban_user',
      'create_profession',
      'deactivate_profession',
    ]));
  });
});
