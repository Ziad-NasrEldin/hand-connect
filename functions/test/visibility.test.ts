import { describe, expect, it } from 'vitest';
import {
  approveVisibility,
  createVisibilityEntitlement,
  expiredVisibilityPatch,
  renewalAmountCents,
  renewalAttemptId,
  renewalDecision,
  renewalMerchantOrderId,
  validatePaymobCallbackForRequest,
} from '../src/visibility.js';

describe('approveVisibility', () => {
  it('returns a paid-until date thirty days out by default', () => {
    expect(approveVisibility(new Date('2026-05-04T00:00:00.000Z'))).toBe('2026-06-03T00:00:00.000Z');
  });

  it('uses the configured product duration', () => {
    expect(approveVisibility(new Date('2026-05-04T00:00:00.000Z'), 90)).toBe('2026-08-02T00:00:00.000Z');
  });

  it('resets active paid state for expiry reconciliation', () => {
    expect(expiredVisibilityPatch()).toEqual({
      visibilityTier: 'organic',
      visibilityPaidUntil: null,
      paidVisibilityStartedAt: null,
      activeVisibilityRequestId: null,
      activeVisibilityProductId: null,
      activeVisibilityProductVersion: null,
    });
  });

  it('creates a 30-day active entitlement when payment is approved', () => {
    expect(
      createVisibilityEntitlement(
        'visibility-1',
        {
          providerId: 'provider-1',
          type: 'area_expansion',
          serviceArea: 'maadi',
          status: 'pending',
          productSnapshot: {
            productId: 'area_expansion_30_paymob',
            productVersion: 2,
            productType: 'area_expansion',
            durationDays: 30,
            priceAmount: 250,
            currency: 'EGP',
            billingModel: 'monthly_auto_renew',
            capPolicy: 'coverage_only',
            paymentProvider: 'paymob',
            renewalPolicy: 'auto_charge_card',
          },
        },
        new Date('2026-05-04T00:00:00.000Z'),
      ),
    ).toMatchObject({
      providerId: 'provider-1',
      requestId: 'visibility-1',
      status: 'active',
      startedAt: '2026-05-04T00:00:00.000Z',
      endsAt: '2026-06-03T00:00:00.000Z',
      renewalStatus: 'active',
    });
  });

  it('converts renewal prices to Paymob cents', () => {
    expect(
      renewalAmountCents({
        providerId: 'provider-1',
        requestId: 'visibility-1',
        type: 'area_expansion',
        serviceArea: 'maadi',
        status: 'active',
        startedAt: '2026-05-04T00:00:00.000Z',
        endsAt: '2026-06-03T00:00:00.000Z',
        renewedAt: null,
        renewalStatus: 'active',
        renewalFailureReason: null,
        paymentReference: null,
        productSnapshot: {
          productId: 'area_expansion_30_paymob',
          productVersion: 2,
          durationDays: 30,
          priceAmount: 250,
        },
      }),
    ).toBe(25000);
  });

  it('renews only when Paymob config, card token, provider, and price are present', () => {
    const entitlement = createVisibilityEntitlement(
      'visibility-1',
      {
        providerId: 'provider-1',
        type: 'area_expansion',
        serviceArea: 'maadi',
        status: 'pending',
        productSnapshot: {
          productId: 'area_expansion_30_paymob',
          productVersion: 2,
          durationDays: 30,
          priceAmount: 250,
          paymentProvider: 'paymob',
          renewalPolicy: 'auto_charge_card',
        },
      },
      new Date('2026-05-04T00:00:00.000Z'),
    );
    expect(renewalDecision(entitlement, { paymobCardToken: 'card-token' }, true)).toEqual({
      action: 'renew',
      reason: null,
      amountCents: 25000,
    });
    expect(renewalDecision(entitlement, { paymobCardToken: 'card-token' }, false)).toMatchObject({
      action: 'expire',
      reason: 'paymob_config_missing',
    });
    expect(renewalDecision(entitlement, {}, true)).toMatchObject({
      action: 'expire',
      reason: 'paymob_card_missing',
    });
  });

  it('builds deterministic renewal attempt and merchant order ids per entitlement period', () => {
    const entitlement = createVisibilityEntitlement(
      'visibility-1',
      {
        providerId: 'provider-1',
        type: 'area_expansion',
        serviceArea: 'maadi',
        status: 'pending',
        productSnapshot: {
          productId: 'area_expansion_30_paymob',
          productVersion: 2,
          durationDays: 30,
          priceAmount: 250,
          paymentProvider: 'paymob',
          renewalPolicy: 'auto_charge_card',
        },
      },
      new Date('2026-05-04T00:00:00.000Z'),
    );

    expect(renewalAttemptId(entitlement)).toBe('visibility-1_2026-06-03T00_00_00_000Z');
    expect(renewalMerchantOrderId(entitlement)).toBe('renewal_visibility-1_2026-06-03T00_00_00_000Z');
  });

  it('does not auto-renew pay-as-you-go visibility boosts', () => {
    const entitlement = createVisibilityEntitlement(
      'visibility-boost-1',
      {
        providerId: 'provider-1',
        type: 'boost',
        serviceArea: 'maadi',
        status: 'pending',
        productSnapshot: {
          productId: 'visibility_boost_30_paymob',
          productVersion: 2,
          durationDays: 30,
          priceAmount: 500,
          paymentProvider: 'paymob',
          renewalPolicy: 'none',
        },
      },
      new Date('2026-05-04T00:00:00.000Z'),
    );

    expect(renewalDecision(entitlement, { paymobCardToken: 'card-token' }, true)).toMatchObject({
      action: 'expire',
      reason: 'renewal_not_enabled',
    });
  });

  it('validates Paymob callback amount, currency, integration, and order against the request', () => {
    const request = {
      providerId: 'provider-1',
      type: 'boost' as const,
      serviceArea: 'maadi',
      status: 'pending' as const,
      paymentMethod: 'paymob_card' as const,
      paymentStatus: 'requires_action' as const,
      productSnapshot: {
        productId: 'visibility_boost_30_paymob',
        productVersion: 2,
        durationDays: 30,
        priceAmount: 500,
        currency: 'EGP' as const,
        paymentProvider: 'paymob' as const,
        renewalPolicy: 'none' as const,
      },
      paymentSession: {
        provider: 'paymob' as const,
        mode: 'live' as const,
        status: 'requires_action' as const,
        checkoutUrl: 'https://paymob.example/checkout',
        merchantOrderId: 'visibility_provider_1',
        integrationId: '5425618',
        orderId: 'order-1',
        updatedAt: '2026-05-04T00:00:00.000Z',
      },
    };
    const payload = {
      amount_cents: '50000',
      currency: 'EGP',
      integration_id: '5425618',
      order: 'order-1',
    };

    expect(validatePaymobCallbackForRequest(payload, request)).toBeNull();
    expect(validatePaymobCallbackForRequest({ ...payload, amount_cents: '25000' }, request)).toBe('paymob_amount_mismatch');
    expect(validatePaymobCallbackForRequest({ ...payload, currency: 'USD' }, request)).toBe('paymob_currency_mismatch');
    expect(validatePaymobCallbackForRequest({ ...payload, integration_id: 'other' }, request)).toBe('paymob_integration_mismatch');
    expect(validatePaymobCallbackForRequest({ ...payload, order: 'other-order' }, request)).toBe('paymob_order_mismatch');
  });
});
