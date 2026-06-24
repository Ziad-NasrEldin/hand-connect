import { createId, readDb, writeDb } from './demo-db';
import type { VisibilityRequest } from '@/types/visibility';
import { nowIso } from '@/lib/dates';
import { productForVisibilityRequest } from '@/config/paid-products';
import type { PaymentMethod } from '@/types/monetization';

function normalizePaymentMethod(value: PaymentMethod | 'manual'): PaymentMethod {
  return value === 'manual' ? 'manual_cash' : value;
}

function paymentMerchantOrderId(providerId: string, requestedAt: string) {
  return `visibility_${providerId}_${requestedAt}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
}

function approvePaidVisibility(requestId: string) {
  const db = readDb();
  const request = db.visibilityRequests.find((item) => item.id === requestId);
  if (!request) throw new Error('error.request.notFound');
  const provider = db.providers.find((item) => item.id === request.providerId);
  if (!provider) throw new Error('error.provider.notFound');
  if (request.paymentStatus === 'matched' && request.status === 'approved') return request;
  const now = nowIso();
  request.status = 'approved';
  request.paymentStatus = 'matched';
  request.paymentReference = request.paymentReference ?? `paymob_mock_${request.id}`;
  request.paymentFailureReason = null;
  request.paymentConfirmedBy = 'paymob-mock-callback';
  request.processedAt = now;
  request.paymentSession = request.paymentSession
    ? { ...request.paymentSession, status: 'paid', updatedAt: now }
    : request.paymentSession;
  if (request.type === 'area_expansion') {
    if (!provider.serviceAreaKeys.includes(request.serviceArea)) {
      provider.serviceAreaKeys.push(request.serviceArea);
      provider.coverageAreaKeys = [...new Set([...provider.coverageAreaKeys, request.serviceArea])].sort();
      provider.serviceAreas.push({ neighborhood: request.serviceArea, city: 'cairo' });
    }
  } else {
    const durationDays = request.productSnapshot?.durationDays ?? 30;
    provider.visibilityTier = 'paid';
    provider.visibilityPaidUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * durationDays).toISOString();
    provider.paidVisibilityStartedAt = now;
    provider.activeVisibilityRequestId = request.id;
    provider.activeVisibilityProductId = request.productSnapshot?.productId ?? null;
    provider.activeVisibilityProductVersion = request.productSnapshot?.productVersion ?? null;
  }
  writeDb(db);
  return request;
}

export async function createVisibilityRequest(providerId: string, serviceArea: string, paymentMethod: PaymentMethod | 'manual', notes: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('error.provider.notFound');
  if (provider.status !== 'approved') throw new Error('error.visibility.providerNotApproved');
  const isAreaExpansion = !provider.serviceAreaKeys.includes(serviceArea);
  if (isAreaExpansion && provider.reviewCount < 30) {
    throw new Error('error.visibility.areaExpansionRequiresReviews');
  }
  if (db.visibilityRequests.some((item) => item.providerId === providerId && item.serviceArea === serviceArea && item.status === 'pending')) {
    throw new Error('error.visibility.pendingExists');
  }
  const requestedAt = nowIso();
  const type = isAreaExpansion ? 'area_expansion' : 'boost';
  const product = productForVisibilityRequest(type);
  if (!product) throw new Error('error.visibility.productUnavailable');
  const request: VisibilityRequest = {
    id: createId('visibility'),
    providerId,
    type,
    tier: 'paid',
    serviceArea,
    status: 'pending',
    paymentConfirmedBy: null,
    paymentMethod: normalizePaymentMethod(paymentMethod),
    paymentStatus: normalizePaymentMethod(paymentMethod) === 'paymob_card' ? 'requires_action' : 'pending',
    paymentReference: null,
    paymentFailureReason: null,
    productSnapshot: {
      productId: product.id,
      productVersion: product.version,
      productType: product.type,
      durationDays: product.durationDays,
      priceAmount: product.priceAmount,
      currency: product.currency,
      billingModel: product.billingModel,
      capPolicy: product.capPolicy,
      paymentProvider: product.paymentProvider,
      renewalPolicy: product.renewalPolicy,
      snapshotAt: requestedAt,
    },
    disclosureVersion: 'visibility-no-guarantee-v1',
    disclosureAcceptedAt: requestedAt,
    notes,
    requestedAt,
    processedAt: null,
  };
  if (request.paymentMethod === 'paymob_card') {
    request.paymentSession = {
      provider: 'paymob',
      mode: 'mock',
      status: 'requires_action',
      checkoutUrl: `/visibility?paymob_mock_request=${encodeURIComponent(request.id)}`,
      merchantOrderId: paymentMerchantOrderId(providerId, requestedAt),
      integrationId: '5425618',
      orderId: `mock_order_${request.id}`,
      intentionId: `mock_intention_${request.id}`,
      paymentKey: null,
      updatedAt: requestedAt,
    };
  }
  db.visibilityRequests.push(request);
  writeDb(db);
  return request;
}

export async function completeVisibilityPayment(requestId: string) {
  return approvePaidVisibility(requestId);
}

export async function listProviderVisibilityRequests(providerId: string) {
  return readDb().visibilityRequests.filter((item) => item.providerId === providerId);
}
