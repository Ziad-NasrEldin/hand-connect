import { beforeEach, describe, expect, it, vi } from 'vitest';
import { approveVisibilityRequest } from './admin.service';
import { completeVisibilityPayment, createVisibilityRequest } from './visibility.service';
import { paidProducts } from '@/config/paid-products';
import { readDb, resetDemoDb, writeDb } from './demo/demo-db';

describe('visibility service', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    resetDemoDb();
  });

  it('configures paid visibility as pay-as-you-go with no visibility cap or auto-renewal', () => {
    const boost = paidProducts.find((product) => product.type === 'visibility_boost');
    expect(boost).toMatchObject({
      billingModel: 'pay_as_you_go',
      capPolicy: 'none',
      paymentProvider: 'paymob',
      renewalPolicy: 'none',
    });
  });

  it('does not allow active auto-renew products without a positive price', () => {
    expect(
      paidProducts.filter(
        (product) =>
          product.active &&
          product.renewalPolicy === 'auto_charge_card' &&
          (typeof product.priceAmount !== 'number' || product.priceAmount <= 0),
      ),
    ).toEqual([]);
  });

  it('configures area expansion at 250 EGP monthly auto-renew through Paymob', () => {
    const areaExpansion = paidProducts.find((product) => product.type === 'area_expansion');
    expect(areaExpansion).toMatchObject({
      priceAmount: 250,
      currency: 'EGP',
      billingModel: 'monthly_auto_renew',
      paymentProvider: 'paymob',
      renewalPolicy: 'auto_charge_card',
    });
  });

  it('persists product price, billing, cap, and payment provider details in request snapshots', async () => {
    const request = await createVisibilityRequest('provider-demo', 'new-cairo', 'paymob_card', 'Boost visibility');
    expect(request.paymentStatus).toBe('requires_action');
    expect(request.paymentSession).toMatchObject({
      provider: 'paymob',
      mode: 'mock',
      status: 'requires_action',
      integrationId: '5425618',
    });
    expect(request.productSnapshot).toMatchObject({
      productType: 'visibility_boost',
      durationDays: 30,
      priceAmount: 500,
      currency: 'EGP',
      billingModel: 'pay_as_you_go',
      capPolicy: 'none',
      paymentProvider: 'paymob',
      renewalPolicy: 'none',
    });
  });

  it('completes the mocked Paymob callback and activates paid visibility idempotently', async () => {
    const request = await createVisibilityRequest('provider-demo', 'new-cairo', 'paymob_card', 'Boost visibility');
    const completed = await completeVisibilityPayment(request.id);
    const completedAgain = await completeVisibilityPayment(request.id);
    const provider = readDb().providers.find((item) => item.id === 'provider-demo')!;

    expect(completed.paymentStatus).toBe('matched');
    expect(completedAgain.paymentStatus).toBe('matched');
    expect(completed.paymentReference).toBe(`paymob_mock_${request.id}`);
    expect(provider.visibilityTier).toBe('paid');
    expect(provider.activeVisibilityRequestId).toBe(request.id);
  });

  it('blocks area expansion before 30 reviews', async () => {
    await expect(
      createVisibilityRequest('provider-demo', 'maadi', 'manual', 'Expand to Maadi'),
    ).rejects.toThrow('error.visibility.areaExpansionRequiresReviews');
  });

  it('allows eligible area expansion and admin approval adds the area', async () => {
    const db = readDb();
    const provider = db.providers.find((item) => item.id === 'provider-demo')!;
    provider.reviewCount = 30;
    writeDb(db);

    const request = await createVisibilityRequest('provider-demo', 'maadi', 'manual', 'Expand to Maadi');
    expect(request.type).toBe('area_expansion');
    expect(request.productSnapshot).toMatchObject({
      productType: 'area_expansion',
      priceAmount: 250,
      billingModel: 'monthly_auto_renew',
      paymentProvider: 'paymob',
    });

    await approveVisibilityRequest('admin-demo', request.id, 'admin.reason.paymentConfirmed');

    const updatedProvider = readDb().providers.find((item) => item.id === 'provider-demo')!;
    expect(updatedProvider.serviceAreaKeys).toContain('maadi');
  });
});
