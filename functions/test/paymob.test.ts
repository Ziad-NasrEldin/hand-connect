import { describe, expect, it } from 'vitest';
import {
  billingDataFor,
  isPaymobPaymentApproved,
  merchantOrderIdFromPayload,
  paymobMerchantOrderId,
  signPaymobPayload,
  validatePaymobCallbackConfig,
  validatePaymobSessionConfig,
  verifyPaymobHmac,
} from '../src/paymob.js';

describe('Paymob billing data', () => {
  it('uses provider/user contact details when supplied', () => {
    expect(
      billingDataFor({
        providerId: 'provider-1',
        requestId: 'visibility-1',
        merchantOrderId: 'renewal_visibility-1',
        amountCents: 25000,
        currency: 'EGP',
        cardToken: 'card-token',
        billing: {
          first_name: 'Ziad',
          last_name: 'Nasr',
          email: 'provider@example.test',
          phone_number: '201001112222',
        },
      }),
    ).toMatchObject({
      first_name: 'Ziad',
      last_name: 'Nasr',
      email: 'provider@example.test',
      phone_number: '201001112222',
    });
  });
});

describe('Paymob payment sessions', () => {
  it('uses deterministic safe merchant order ids', () => {
    expect(paymobMerchantOrderId('provider.demo', 'request:1')).toBe('visibility_provider_demo_request_1');
  });

  it('requires iframe id for live checkout sessions but not mock mode', () => {
    expect(() =>
      validatePaymobSessionConfig({
        apiKey: 'api-key',
        integrationId: '5425618',
        apiBaseUrl: 'https://accept.paymob.com',
      }),
    ).toThrow('PAYMOB_IFRAME_ID');
    expect(() =>
      validatePaymobSessionConfig({
        apiKey: 'api-key',
        integrationId: '5425618',
        mockMode: true,
        apiBaseUrl: 'https://accept.paymob.com',
      }),
    ).not.toThrow();
  });

  it('requires HMAC secret for live callbacks but not mock mode', () => {
    expect(() =>
      validatePaymobCallbackConfig({
        apiKey: 'test-api-key',
        integrationId: '5425618',
        apiBaseUrl: 'https://accept.paymob.com',
      }),
    ).toThrow('PAYMOB_HMAC_SECRET');
    expect(() =>
      validatePaymobCallbackConfig({
        apiKey: 'test-api-key',
        integrationId: '5425618',
        hmacSecret: 'hmac-secret',
        apiBaseUrl: 'https://accept.paymob.com',
      }),
    ).not.toThrow();
    expect(() =>
      validatePaymobCallbackConfig({
        apiKey: 'test-api-key',
        integrationId: '5425618',
        mockMode: true,
        apiBaseUrl: 'https://accept.paymob.com',
      }),
    ).not.toThrow();
  });

  it('verifies Paymob HMAC without exposing the secret', () => {
    const payload = {
      amount_cents: '50000',
      created_at: '2026-06-24T10:00:00.000Z',
      currency: 'EGP',
      error_occured: 'false',
      has_parent_transaction: 'false',
      id: 'txn_1',
      integration_id: '5425618',
      is_3d_secure: 'true',
      is_auth: 'false',
      is_capture: 'false',
      is_refunded: 'false',
      is_standalone_payment: 'true',
      is_voided: 'false',
      order: 'order_1',
      owner: 'owner_1',
      pending: 'false',
      source_data_pan: '2346',
      source_data_sub_type: 'MasterCard',
      source_data_type: 'card',
      success: 'true',
    };
    const hmac = signPaymobPayload(payload, 'test-hmac-secret');
    expect(verifyPaymobHmac({ ...payload, hmac }, 'test-hmac-secret')).toBe(true);
    expect(verifyPaymobHmac({ ...payload, success: 'false', hmac }, 'test-hmac-secret')).toBe(false);
  });

  it('parses successful callbacks and merchant order ids', () => {
    expect(isPaymobPaymentApproved({ success: 'true', pending: 'false' })).toBe(true);
    expect(isPaymobPaymentApproved({ success: 'true', pending: 'true' })).toBe(false);
    expect(
      merchantOrderIdFromPayload({
        order: { id: 123, merchant_order_id: 'visibility_provider_request' },
      }),
    ).toBe('visibility_provider_request');
  });
});
