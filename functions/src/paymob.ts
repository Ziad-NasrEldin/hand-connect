import { createHmac, timingSafeEqual } from 'node:crypto';

export interface PaymobConfig {
  apiKey?: string;
  integrationId?: string;
  iframeId?: string;
  hmacSecret?: string;
  mockMode?: boolean;
  apiBaseUrl: string;
}

export interface PaymobChargeRequest {
  providerId: string;
  requestId: string;
  merchantOrderId: string;
  amountCents: number;
  currency: 'EGP';
  cardToken: string;
  billing?: Partial<PaymobBillingData>;
}

interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment: string;
  floor: string;
  street: string;
  building: string;
  shipping_method: string;
  postal_code: string;
  city: string;
  country: string;
  state: string;
}

export interface PaymobChargeResult {
  status: 'approved' | 'declined';
  reference: string | null;
  rawStatus?: string;
}

export interface PaymobSessionRequest {
  providerId: string;
  requestId: string;
  merchantOrderId: string;
  amountCents: number;
  currency: 'EGP';
  billing?: Partial<PaymobBillingData>;
}

export interface PaymobPaymentSession {
  checkoutUrl: string | null;
  merchantOrderId: string;
  integrationId: string;
  orderId: string | null;
  paymentKey: string | null;
  mode: 'mock' | 'live';
}

export interface PaymobCallbackPayload {
  success?: boolean | string;
  is_refunded?: boolean | string;
  is_voided?: boolean | string;
  pending?: boolean | string;
  amount_cents?: string | number;
  currency?: string;
  integration_id?: string | number;
  order?: string | number | { id?: string | number; merchant_order_id?: string };
  merchant_order_id?: string;
  id?: string | number;
  txn_response_code?: string;
  hmac?: string;
  token?: string;
  card_token?: string;
}

export class PaymobConfigurationError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Paymob configuration is incomplete: ${missing.join(', ')}`);
  }
}

export function paymobConfigFromEnv(env: NodeJS.ProcessEnv = process.env): PaymobConfig {
  return {
    apiKey: env.PAYMOB_API_KEY,
    integrationId: env.PAYMOB_INTEGRATION_ID,
    iframeId: env.PAYMOB_IFRAME_ID,
    hmacSecret: env.PAYMOB_HMAC_SECRET,
    mockMode: env.PAYMOB_MOCK_MODE === 'true',
    apiBaseUrl: env.PAYMOB_API_BASE_URL ?? 'https://accept.paymob.com',
  };
}

export function validatePaymobConfig(config: PaymobConfig) {
  const missing: string[] = [];
  if (!config.apiKey) missing.push('PAYMOB_API_KEY');
  if (!config.integrationId) missing.push('PAYMOB_INTEGRATION_ID');
  if (missing.length) throw new PaymobConfigurationError(missing);
}

export function validatePaymobSessionConfig(config: PaymobConfig) {
  validatePaymobConfig(config);
  if (!config.mockMode && !config.iframeId) throw new PaymobConfigurationError(['PAYMOB_IFRAME_ID']);
}

export function validatePaymobCallbackConfig(config: PaymobConfig) {
  validatePaymobConfig(config);
  if (!config.mockMode && !config.hmacSecret) throw new PaymobConfigurationError(['PAYMOB_HMAC_SECRET']);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Paymob request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export function billingDataFor(request: PaymobChargeRequest): PaymobBillingData {
  return {
    first_name: request.billing?.first_name || 'Herafy',
    last_name: request.billing?.last_name || 'Provider',
    email: request.billing?.email || `${request.providerId}@providers.herafy.local`,
    phone_number: request.billing?.phone_number || '01000000000',
    apartment: 'NA',
    floor: 'NA',
    street: 'NA',
    building: 'NA',
    shipping_method: 'NA',
    postal_code: 'NA',
    city: 'Cairo',
    country: 'EG',
    state: 'Cairo',
  };
}

export function paymobMerchantOrderId(providerId: string, requestId: string) {
  return `visibility_${providerId}_${requestId}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
}

function boolValue(value: unknown) {
  return value === true || value === 'true';
}

export function orderIdFromPayload(payload: PaymobCallbackPayload) {
  if (typeof payload.order === 'object' && payload.order?.id !== undefined) return String(payload.order.id);
  if (payload.order !== undefined) return String(payload.order);
  return null;
}

export function merchantOrderIdFromPayload(payload: PaymobCallbackPayload) {
  if (payload.merchant_order_id) return payload.merchant_order_id;
  if (typeof payload.order === 'object' && payload.order?.merchant_order_id) return payload.order.merchant_order_id;
  return null;
}

export function paymentReferenceFromPayload(payload: PaymobCallbackPayload) {
  return payload.id === undefined ? orderIdFromPayload(payload) : String(payload.id);
}

export function amountCentsFromPayload(payload: PaymobCallbackPayload) {
  const value = payload.amount_cents;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

export function tokenizedCardFromPayload(payload: PaymobCallbackPayload) {
  return payload.card_token ?? payload.token ?? null;
}

export function isPaymobPaymentApproved(payload: PaymobCallbackPayload) {
  return boolValue(payload.success) && !boolValue(payload.pending) && !boolValue(payload.is_refunded) && !boolValue(payload.is_voided);
}

const hmacFields = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order',
  'owner',
  'pending',
  'source_data_pan',
  'source_data_sub_type',
  'source_data_type',
  'success',
] as const;

export function paymobHmacMessage(payload: Record<string, unknown>) {
  return hmacFields.map((field) => String(payload[field] ?? '')).join('');
}

export function signPaymobPayload(payload: Record<string, unknown>, secret: string) {
  return createHmac('sha512', secret).update(paymobHmacMessage(payload)).digest('hex');
}

export function verifyPaymobHmac(payload: Record<string, unknown>, secret: string) {
  const actual = typeof payload.hmac === 'string' ? payload.hmac : '';
  if (!actual) return false;
  const expected = signPaymobPayload(payload, secret);
  const actualBuffer = Buffer.from(actual, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createPaymobGateway(config: PaymobConfig = paymobConfigFromEnv()) {
  validatePaymobConfig(config);
  const baseUrl = config.apiBaseUrl.replace(/\/$/, '');
  return {
    async chargeSavedCard(request: PaymobChargeRequest): Promise<PaymobChargeResult> {
      const auth = await postJson<{ token: string }>(`${baseUrl}/api/auth/tokens`, {
        api_key: config.apiKey,
      });
      const order = await postJson<{ id: number }>(`${baseUrl}/api/ecommerce/orders`, {
        auth_token: auth.token,
        delivery_needed: false,
        amount_cents: request.amountCents,
        currency: request.currency,
        merchant_order_id: request.merchantOrderId,
        items: [],
      });
      const paymentKey = await postJson<{ token: string }>(`${baseUrl}/api/acceptance/payment_keys`, {
        auth_token: auth.token,
        amount_cents: request.amountCents,
        expiration: 3600,
        order_id: order.id,
        billing_data: billingDataFor(request),
        currency: request.currency,
        integration_id: Number(config.integrationId),
      });
      const payment = await postJson<{
        id?: number | string;
        success?: boolean;
        pending?: boolean;
        txn_response_code?: string;
      }>(`${baseUrl}/api/acceptance/payments/pay`, {
        source: { identifier: request.cardToken, subtype: 'TOKEN' },
        payment_token: paymentKey.token,
      });
      return {
        status: payment.success === true ? 'approved' : 'declined',
        reference: payment.id === undefined ? null : String(payment.id),
        rawStatus: payment.txn_response_code ?? (payment.pending ? 'pending' : undefined),
      };
    },
    async createCardPaymentSession(request: PaymobSessionRequest): Promise<PaymobPaymentSession> {
      validatePaymobSessionConfig(config);
      if (config.mockMode) {
        return {
          checkoutUrl: `/visibility?paymob_mock_request=${encodeURIComponent(request.requestId)}`,
          merchantOrderId: request.merchantOrderId,
          integrationId: String(config.integrationId),
          orderId: `mock_order_${request.requestId}`,
          paymentKey: null,
          mode: 'mock',
        };
      }
      const auth = await postJson<{ token: string }>(`${baseUrl}/api/auth/tokens`, {
        api_key: config.apiKey,
      });
      const order = await postJson<{ id: number }>(`${baseUrl}/api/ecommerce/orders`, {
        auth_token: auth.token,
        delivery_needed: false,
        amount_cents: request.amountCents,
        currency: request.currency,
        merchant_order_id: request.merchantOrderId,
        items: [],
      });
      const paymentKey = await postJson<{ token: string }>(`${baseUrl}/api/acceptance/payment_keys`, {
        auth_token: auth.token,
        amount_cents: request.amountCents,
        expiration: 3600,
        order_id: order.id,
        billing_data: billingDataFor({ ...request, cardToken: 'unused' }),
        currency: request.currency,
        integration_id: Number(config.integrationId),
      });
      return {
        checkoutUrl: `${baseUrl}/api/acceptance/iframes/${config.iframeId}?payment_token=${paymentKey.token}`,
        merchantOrderId: request.merchantOrderId,
        integrationId: String(config.integrationId),
        orderId: String(order.id),
        paymentKey: paymentKey.token,
        mode: 'live',
      };
    },
  };
}
