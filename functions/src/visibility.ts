import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentReference, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { writeAnalyticsEvent } from './analytics.js';
import { writeAudit } from './audit.js';
import { computeCoverageAreaKeys, getPlatformCoverageRadiusKm } from './coverage.js';
import {
  amountCentsFromPayload,
  PaymobConfigurationError,
  createPaymobGateway,
  isPaymobPaymentApproved,
  merchantOrderIdFromPayload,
  orderIdFromPayload,
  paymentReferenceFromPayload,
  paymobMerchantOrderId,
  paymobConfigFromEnv,
  tokenizedCardFromPayload,
  validatePaymobCallbackConfig,
  validatePaymobConfig,
  verifyPaymobHmac,
  type PaymobCallbackPayload,
} from './paymob.js';

type VisibilityRequestType = 'boost' | 'area_expansion';

interface UserRecord {
  role?: string;
  status?: string;
  displayName?: string;
  email?: string;
  phone?: string;
}

interface VisibilityRequestRecord {
  providerId: string;
  type?: VisibilityRequestType;
  serviceArea: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  productSnapshot?: {
    productId: string;
    productVersion: number;
    productType?: 'visibility_boost' | 'area_expansion';
    durationDays: number;
    priceAmount?: number | null;
    currency?: 'EGP';
    billingModel?: 'pay_as_you_go' | 'monthly_auto_renew';
    capPolicy?: 'none' | 'coverage_only';
    paymentProvider?: 'paymob';
    renewalPolicy?: 'none' | 'auto_charge_card';
  };
  paymentMethod?: 'manual_cash' | 'manual_wallet' | 'manual_bank_transfer' | 'paymob_card';
  paymentStatus?: 'pending' | 'requires_action' | 'matched' | 'failed' | 'rejected' | 'expired';
  paymentReference?: string | null;
  paymentFailureReason?: string | null;
  paymentSession?: {
    provider: 'paymob';
    mode: 'mock' | 'live';
    status: 'initiated' | 'requires_action' | 'paid' | 'failed';
    checkoutUrl: string | null;
    merchantOrderId: string;
    integrationId: string;
    orderId?: string | null;
    intentionId?: string | null;
    paymentKey?: string | null;
    updatedAt: string;
  } | null;
}

interface ProviderRecord {
  status?: string;
  userId?: string;
  profession?: string;
  serviceAreaKeys?: string[];
  initialServiceAreaKey?: string;
  serviceAreas?: Array<{ neighborhood: string; city: 'cairo' }>;
  coverageAreaKeys?: string[];
  reviewCount?: number;
  paymobCardToken?: string | null;
  activeVisibilityRequestId?: string | null;
}

interface RenewalAttemptRecord {
  entitlementId: string;
  providerId: string;
  requestId: string;
  periodEndsAt: string;
  merchantOrderId: string;
  status: 'charging' | 'approved' | 'declined' | 'failed';
  amountCents: number;
  currency: 'EGP';
  chargeReference: string | null;
  rawStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VisibilityEntitlementRecord {
  providerId: string;
  requestId: string;
  type: VisibilityRequestType;
  serviceArea: string;
  status: 'active' | 'expired';
  startedAt: string;
  endsAt: string;
  renewedAt: string | null;
  renewalStatus: 'active' | 'renewed' | 'failed' | 'not_configured';
  renewalFailureReason: string | null;
  paymentReference: string | null;
  productSnapshot?: VisibilityRequestRecord['productSnapshot'];
}

export function approveVisibility(now: Date, days = 30) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function createVisibilityEntitlement(
  requestId: string,
  request: VisibilityRequestRecord,
  now: Date,
): VisibilityEntitlementRecord {
  const durationDays = durationDaysFor(request);
  const timestamp = now.toISOString();
  return {
    providerId: request.providerId,
    requestId,
    type: request.type ?? 'boost',
    serviceArea: request.serviceArea,
    status: 'active',
    startedAt: timestamp,
    endsAt: approveVisibility(now, durationDays),
    renewedAt: null,
    renewalStatus: 'active',
    renewalFailureReason: null,
    paymentReference: null,
    productSnapshot: request.productSnapshot,
  };
}

export function renewalAmountCents(entitlement: VisibilityEntitlementRecord) {
  const amount = entitlement.productSnapshot?.priceAmount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export function renewalAttemptId(entitlement: VisibilityEntitlementRecord) {
  return `${entitlement.requestId}_${entitlement.endsAt}`.replace(/[^A-Za-z0-9_-]/g, '_');
}

export function renewalMerchantOrderId(entitlement: VisibilityEntitlementRecord) {
  return `renewal_${renewalAttemptId(entitlement)}`.slice(0, 120);
}

export function renewalDecision(
  entitlement: VisibilityEntitlementRecord,
  provider: ProviderRecord,
  paymobConfigured: boolean,
): { action: 'renew' | 'expire'; reason: string | null; amountCents: number | null } {
  if (entitlement.productSnapshot?.renewalPolicy !== 'auto_charge_card') {
    return { action: 'expire', reason: 'renewal_not_enabled', amountCents: null };
  }
  if (entitlement.productSnapshot.paymentProvider !== 'paymob') {
    return { action: 'expire', reason: 'payment_provider_not_supported', amountCents: null };
  }
  if (!paymobConfigured) {
    return { action: 'expire', reason: 'paymob_config_missing', amountCents: null };
  }
  if (!provider.paymobCardToken) {
    return { action: 'expire', reason: 'paymob_card_missing', amountCents: null };
  }
  const amountCents = renewalAmountCents(entitlement);
  if (amountCents === null) {
    return { action: 'expire', reason: 'renewal_price_missing', amountCents: null };
  }
  return { action: 'renew', reason: null, amountCents };
}

function ensureApp() {
  if (!getApps().length) initializeApp();
}

function db() {
  ensureApp();
  return getFirestore();
}

function requireAuth(context: { auth?: { uid: string } }) {
  const uid = context.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in is required.');
  return uid;
}

function readString(value: unknown, field: string, maxLength = 1000) {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `${field} is required.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`);
  }
  return trimmed;
}

function readOptionalString(value: unknown, field: string, maxLength = 1000) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `${field} is invalid.`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new HttpsError('invalid-argument', `${field} is invalid.`);
  return trimmed;
}

function isActiveAdmin(user: UserRecord | undefined) {
  return Boolean(user) && user?.role === 'admin' && user?.status !== 'banned';
}

async function requireAdmin(firestore: Firestore, uid: string) {
  const user = await firestore.collection('users').doc(uid).get();
  if (!isActiveAdmin(user.data() as UserRecord | undefined)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
}

function durationDaysFor(request: VisibilityRequestRecord) {
  const days = request.productSnapshot?.durationDays ?? 30;
  if (!Number.isFinite(days) || days <= 0 || days > 366) {
    throw new HttpsError('failed-precondition', 'Visibility product duration is invalid.');
  }
  return days;
}

function renewedProviderVisibilityPatch(entitlement: VisibilityEntitlementRecord, paidUntil: string) {
  return {
    visibilityTier: 'paid' as const,
    visibilityPaidUntil: paidUntil,
    activeVisibilityRequestId: entitlement.requestId,
    activeVisibilityProductId: entitlement.productSnapshot?.productId ?? null,
    activeVisibilityProductVersion: entitlement.productSnapshot?.productVersion ?? null,
  };
}

function billingNames(displayName: string | undefined) {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || 'Herafy',
    last_name: parts.slice(1).join(' ') || 'Provider',
  };
}

function paymobBillingData(provider: ProviderRecord, owner: UserRecord | undefined) {
  return {
    ...billingNames(owner?.displayName),
    email: owner?.email || `${provider.userId ?? 'provider'}@providers.herafy.local`,
    phone_number: (owner?.phone || '').replace(/\D/g, '') || '01000000000',
  };
}

function visibilityProductSnapshot(type: VisibilityRequestType, timestamp: string) {
  return type === 'area_expansion'
    ? {
        productId: 'area_expansion_30_paymob',
        productVersion: 2,
        productType: 'area_expansion' as const,
        durationDays: 30,
        priceAmount: 250,
        currency: 'EGP' as const,
        billingModel: 'monthly_auto_renew' as const,
        capPolicy: 'coverage_only' as const,
        paymentProvider: 'paymob' as const,
        renewalPolicy: 'auto_charge_card' as const,
        snapshotAt: timestamp,
      }
    : {
        productId: 'visibility_boost_30_paymob',
        productVersion: 2,
        productType: 'visibility_boost' as const,
        durationDays: 30,
        priceAmount: 500,
        currency: 'EGP' as const,
        billingModel: 'pay_as_you_go' as const,
        capPolicy: 'none' as const,
        paymentProvider: 'paymob' as const,
        renewalPolicy: 'none' as const,
        snapshotAt: timestamp,
      };
}

function expectedPaymobAmountCents(request: VisibilityRequestRecord) {
  const amount = request.productSnapshot?.priceAmount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export function validatePaymobCallbackForRequest(
  payload: PaymobCallbackPayload,
  request: VisibilityRequestRecord,
) {
  const expectedAmountCents = expectedPaymobAmountCents(request);
  const actualAmountCents = amountCentsFromPayload(payload);
  const actualOrderId = orderIdFromPayload(payload);
  const actualIntegrationId = payload.integration_id === undefined ? null : String(payload.integration_id);
  const session = request.paymentSession;
  if (request.paymentMethod !== 'paymob_card') return 'payment_method_not_paymob';
  if (!session || session.provider !== 'paymob') return 'paymob_session_missing';
  if (request.productSnapshot?.paymentProvider !== 'paymob') return 'payment_provider_not_paymob';
  if (expectedAmountCents === null || actualAmountCents !== expectedAmountCents) return 'paymob_amount_mismatch';
  if (payload.currency !== (request.productSnapshot?.currency ?? 'EGP')) return 'paymob_currency_mismatch';
  if (!actualIntegrationId || actualIntegrationId !== session.integrationId) return 'paymob_integration_mismatch';
  if (session.orderId && actualOrderId !== session.orderId) return 'paymob_order_mismatch';
  return null;
}

function paymobReferenceDocId(reference: string) {
  return `paymob_${reference}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 180);
}

function applyApprovedVisibility(
  transaction: Transaction,
  firestore: Firestore,
  requestRef: DocumentReference,
  providerRef: DocumentReference,
  requestId: string,
  requestData: VisibilityRequestRecord,
  providerData: ProviderRecord,
  actorId: string,
  notes: string,
  timestamp: string,
  paymentReference: string | null,
) {
  const now = new Date(timestamp);
  const durationDays = durationDaysFor(requestData);
  const paidUntil = approveVisibility(now, durationDays);
  const entitlement = createVisibilityEntitlement(requestId, requestData, now);
  transaction.update(requestRef, {
    status: 'approved',
    paymentConfirmedBy: actorId,
    paymentStatus: 'matched',
    paymentReference,
    paymentFailureReason: null,
    paymentSession: requestData.paymentSession
      ? { ...requestData.paymentSession, status: 'paid', updatedAt: timestamp }
      : null,
    notes: [requestData.notes, notes].filter(Boolean).join('\n'),
    processedAt: timestamp,
  });
  transaction.set(firestore.collection('visibilityEntitlements').doc(requestId), {
    ...entitlement,
    paymentReference,
  });
  if (requestData.type === 'area_expansion') {
    if ((providerData.reviewCount ?? 0) < 30) {
      throw new HttpsError('failed-precondition', 'Area expansion requires at least 30 reviews.');
    }
    if (!(providerData.serviceAreaKeys ?? []).includes(requestData.serviceArea)) {
      transaction.update(providerRef, {
        serviceAreaKeys: [...(providerData.serviceAreaKeys ?? []), requestData.serviceArea],
        coverageAreaKeys: computeCoverageAreaKeys(
          [...(providerData.serviceAreaKeys ?? []), requestData.serviceArea],
          getPlatformCoverageRadiusKm({
            city: providerData.serviceAreas?.[0]?.city,
            profession: providerData.profession,
            serviceAreaKey: providerData.initialServiceAreaKey ?? providerData.serviceAreaKeys?.[0],
          }),
        ),
        serviceAreas: [
          ...(providerData.serviceAreas ?? []),
          { neighborhood: requestData.serviceArea, city: 'cairo' },
        ],
      });
    }
  } else {
    transaction.update(providerRef, {
      visibilityTier: 'paid',
      visibilityPaidUntil: paidUntil,
      paidVisibilityStartedAt: timestamp,
      activeVisibilityRequestId: requestId,
      activeVisibilityProductId: requestData.productSnapshot?.productId ?? null,
      activeVisibilityProductVersion: requestData.productSnapshot?.productVersion ?? null,
    });
  }
  writeAudit(transaction, firestore, {
    adminId: actorId,
    targetType: 'visibilityRequest',
    targetId: requestId,
    action: 'approve_visibility',
    reason: notes,
    createdAt: timestamp,
  });
}

export const approveVisibilityRequest = onCall(async (request) => {
  const adminId = requireAuth(request);
  const requestId = readString(request.data?.requestId, 'requestId', 120);
  const notes = readString(request.data?.notes, 'notes', 1000);
  const firestore = db();
  await requireAdmin(firestore, adminId);

  await firestore.runTransaction(async (transaction) => {
    const requestRef = firestore.collection('visibilityRequests').doc(requestId);
    const requestSnapshot = await transaction.get(requestRef);
    if (!requestSnapshot.exists) throw new HttpsError('not-found', 'Visibility request not found.');
    const requestData = requestSnapshot.data() as VisibilityRequestRecord;
    if (requestData.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Only pending requests can be approved.');
    }
    const providerRef = firestore.collection('providers').doc(requestData.providerId);
    const providerSnapshot = await transaction.get(providerRef);
    if (!providerSnapshot.exists) throw new HttpsError('not-found', 'Provider not found.');
    const providerData = providerSnapshot.data() as ProviderRecord;
    if (providerData.status !== 'approved') {
      throw new HttpsError('failed-precondition', 'Provider must be approved.');
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const durationDays = durationDaysFor(requestData);
    const paidUntil = approveVisibility(now, durationDays);
    const entitlement = createVisibilityEntitlement(requestId, requestData, now);
    transaction.update(requestRef, {
      status: 'approved',
      paymentConfirmedBy: adminId,
      paymentStatus: 'matched',
      paymentReference: requestData.paymentReference ?? null,
      paymentFailureReason: null,
      paymentSession: requestData.paymentSession
        ? { ...requestData.paymentSession, status: 'paid', updatedAt: timestamp }
        : null,
      notes: [requestData.notes, notes].filter(Boolean).join('\n'),
      processedAt: timestamp,
    });
    transaction.set(firestore.collection('visibilityEntitlements').doc(requestId), entitlement);

    if (requestData.type === 'area_expansion') {
      if ((providerData.reviewCount ?? 0) < 30) {
        throw new HttpsError('failed-precondition', 'Area expansion requires at least 30 reviews.');
      }
      if (!(providerData.serviceAreaKeys ?? []).includes(requestData.serviceArea)) {
        transaction.update(providerRef, {
          serviceAreaKeys: [...(providerData.serviceAreaKeys ?? []), requestData.serviceArea],
          coverageAreaKeys: computeCoverageAreaKeys(
            [...(providerData.serviceAreaKeys ?? []), requestData.serviceArea],
            getPlatformCoverageRadiusKm({
              city: providerData.serviceAreas?.[0]?.city,
              profession: providerData.profession,
              serviceAreaKey: providerData.initialServiceAreaKey ?? providerData.serviceAreaKeys?.[0],
            }),
          ),
          serviceAreas: [
            ...(providerData.serviceAreas ?? []),
            { neighborhood: requestData.serviceArea, city: 'cairo' },
          ],
        });
      }
      writeAnalyticsEvent(transaction, firestore, {
        type: 'area_expansion_approved',
        actorId: adminId,
        targetType: 'visibilityRequest',
        targetId: requestId,
        metadata: { providerId: requestData.providerId, serviceArea: requestData.serviceArea },
        createdAt: timestamp,
      });
    } else {
      transaction.update(providerRef, {
        visibilityTier: 'paid',
        visibilityPaidUntil: paidUntil,
        paidVisibilityStartedAt: timestamp,
        activeVisibilityRequestId: requestId,
        activeVisibilityProductId: requestData.productSnapshot?.productId ?? null,
        activeVisibilityProductVersion: requestData.productSnapshot?.productVersion ?? null,
      });
      writeAnalyticsEvent(transaction, firestore, {
        type: 'paid_visibility_started',
        actorId: adminId,
        targetType: 'provider',
        targetId: requestData.providerId,
        metadata: { requestId, paidUntil, durationDays },
        createdAt: timestamp,
      });
    }

    writeAudit(transaction, firestore, {
      adminId,
      targetType: 'visibilityRequest',
      targetId: requestId,
      action: 'approve_visibility',
      reason: notes,
      createdAt: timestamp,
    });
  });
});

export const startVisibilityPaymobPayment = onCall(async (request) => {
  const userId = requireAuth(request);
  const providerId = readString(request.data?.providerId, 'providerId', 120);
  const serviceArea = readString(request.data?.serviceArea, 'serviceArea', 120);
  const notes = readOptionalString(request.data?.notes, 'notes', 1000);
  const firestore = db();
  const providerRef = firestore.collection('providers').doc(providerId);
  const providerSnapshot = await providerRef.get();
  if (!providerSnapshot.exists) throw new HttpsError('not-found', 'Provider not found.');
  const providerData = providerSnapshot.data() as ProviderRecord;
  if (providerData.userId !== userId) throw new HttpsError('permission-denied', 'Provider ownership is required.');
  if (providerData.status !== 'approved') throw new HttpsError('failed-precondition', 'Provider must be approved.');
  const isAreaExpansion = !(providerData.serviceAreaKeys ?? []).includes(serviceArea);
  if (isAreaExpansion && (providerData.reviewCount ?? 0) < 30) {
    throw new HttpsError('failed-precondition', 'Area expansion requires at least 30 reviews.');
  }
  const pending = await firestore
    .collection('visibilityRequests')
    .where('providerId', '==', providerId)
    .where('serviceArea', '==', serviceArea)
    .where('status', '==', 'pending')
    .limit(1)
    .get();
  if (!pending.empty) throw new HttpsError('failed-precondition', 'A pending visibility request already exists.');

  const timestamp = new Date().toISOString();
  const requestRef = firestore.collection('visibilityRequests').doc();
  const type: VisibilityRequestType = isAreaExpansion ? 'area_expansion' : 'boost';
  const productSnapshot = visibilityProductSnapshot(type, timestamp);
  const amountCents = Math.round((productSnapshot.priceAmount ?? 0) * 100);
  if (amountCents <= 0) throw new HttpsError('failed-precondition', 'Visibility product price is invalid.');
  const merchantOrderId = paymobMerchantOrderId(providerId, requestRef.id);
  const ownerSnapshot = providerData.userId
    ? await firestore.collection('users').doc(providerData.userId).get()
    : null;
  const session = await createPaymobGateway().createCardPaymentSession({
    providerId,
    requestId: requestRef.id,
    merchantOrderId,
    amountCents,
    currency: 'EGP',
    billing: paymobBillingData(providerData, ownerSnapshot?.data() as UserRecord | undefined),
  });
  const visibilityRequest = {
    providerId,
    type,
    tier: 'paid',
    serviceArea,
    status: 'pending',
    paymentConfirmedBy: null,
    paymentMethod: 'paymob_card',
    paymentStatus: 'requires_action',
    paymentReference: null,
    paymentFailureReason: null,
    paymentSession: {
      provider: 'paymob',
      mode: session.mode,
      status: 'requires_action',
      checkoutUrl: session.checkoutUrl,
      merchantOrderId: session.merchantOrderId,
      integrationId: session.integrationId,
      orderId: session.orderId,
      intentionId: null,
      paymentKey: session.mode === 'mock' ? null : session.paymentKey,
      updatedAt: timestamp,
    },
    productSnapshot,
    disclosureVersion: 'visibility-no-guarantee-v1',
    disclosureAcceptedAt: timestamp,
    notes,
    requestedAt: timestamp,
    processedAt: null,
  };
  await requestRef.set(visibilityRequest);
  return { id: requestRef.id, ...visibilityRequest };
});

export const handlePaymobVisibilityCallback = onRequest(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.status(405).send('Method not allowed');
    return;
  }
  const payload = {
    ...(request.method === 'GET' ? request.query : request.body),
  } as Record<string, unknown> & PaymobCallbackPayload;
  const config = paymobConfigFromEnv();
  try {
    validatePaymobCallbackConfig(config);
  } catch (error) {
    if (error instanceof PaymobConfigurationError) {
      logger.error('Paymob callback configuration missing.', { missing: error.missing });
      response.status(500).send('Paymob callback is not configured');
      return;
    }
    throw error;
  }
  if (!config.mockMode && !verifyPaymobHmac(payload, config.hmacSecret!)) {
    response.status(403).send('Invalid Paymob signature');
    return;
  }
  const merchantOrderId = merchantOrderIdFromPayload(payload);
  if (!merchantOrderId) {
    response.status(400).send('Missing merchant order id');
    return;
  }
  const firestore = db();
  const matching = await firestore
    .collection('visibilityRequests')
    .where('paymentSession.merchantOrderId', '==', merchantOrderId)
    .limit(1)
    .get();
  if (matching.empty) {
    response.status(404).send('Visibility payment request not found');
    return;
  }
  const requestSnapshot = matching.docs[0];
  const requestRef = requestSnapshot.ref;
  const requestId = requestSnapshot.id;
  const requestData = requestSnapshot.data() as VisibilityRequestRecord;
  const providerRef = firestore.collection('providers').doc(requestData.providerId);
  const providerSnapshot = await providerRef.get();
  if (!providerSnapshot.exists) {
    response.status(404).send('Provider not found');
    return;
  }
  const timestamp = new Date().toISOString();
  const approved = isPaymobPaymentApproved(payload);
  const reference = paymentReferenceFromPayload(payload);
  if (approved && !reference) {
    response.status(400).send('Missing Paymob payment reference');
    return;
  }
  await firestore.runTransaction(async (transaction) => {
    const currentRequestSnapshot = await transaction.get(requestRef);
    const currentRequest = currentRequestSnapshot.data() as VisibilityRequestRecord | undefined;
    if (!currentRequest || currentRequest.paymentStatus === 'matched') return;
    if (currentRequest.status !== 'pending' || currentRequest.paymentStatus !== 'requires_action') return;
    const currentProviderSnapshot = await transaction.get(providerRef);
    const currentProvider = currentProviderSnapshot.data() as ProviderRecord | undefined;
    if (!currentProvider) throw new HttpsError('not-found', 'Provider not found.');
    if (approved) {
      const mismatch = validatePaymobCallbackForRequest(payload, currentRequest);
      if (mismatch) throw new HttpsError('failed-precondition', mismatch);
      const transactionRef = firestore.collection('paymobTransactions').doc(paymobReferenceDocId(reference!));
      applyApprovedVisibility(
        transaction,
        firestore,
        requestRef,
        providerRef,
        requestId,
        currentRequest,
        currentProvider,
        'paymob-callback',
        'admin.reason.paymentConfirmed',
        timestamp,
        reference,
      );
      transaction.create(transactionRef, {
        provider: 'paymob',
        reference,
        merchantOrderId,
        requestId,
        providerId: currentRequest.providerId,
        amountCents: amountCentsFromPayload(payload),
        currency: payload.currency ?? null,
        integrationId: payload.integration_id === undefined ? null : String(payload.integration_id),
        orderId: orderIdFromPayload(payload),
        processedAt: timestamp,
      });
      const cardToken = tokenizedCardFromPayload(payload);
      if (cardToken) transaction.update(providerRef, { paymobCardToken: cardToken });
      return;
    }
    transaction.update(requestRef, {
      paymentStatus: 'failed',
      paymentFailureReason: payload.txn_response_code ?? 'paymob_payment_failed',
      paymentReference: reference,
      paymentSession: currentRequest.paymentSession
        ? { ...currentRequest.paymentSession, status: 'failed', updatedAt: timestamp }
        : null,
      processedAt: timestamp,
    });
  });
  response.status(200).send('ok');
});

export const rejectVisibilityRequest = onCall(async (request) => {
  const adminId = requireAuth(request);
  const requestId = readString(request.data?.requestId, 'requestId', 120);
  const reason = readString(request.data?.reason, 'reason', 1000);
  const firestore = db();
  await requireAdmin(firestore, adminId);

  await firestore.runTransaction(async (transaction) => {
    const requestRef = firestore.collection('visibilityRequests').doc(requestId);
    const requestSnapshot = await transaction.get(requestRef);
    if (!requestSnapshot.exists) throw new HttpsError('not-found', 'Visibility request not found.');
    const requestData = requestSnapshot.data() as VisibilityRequestRecord;
    if (requestData.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Only pending requests can be rejected.');
    }
    const timestamp = new Date().toISOString();
    transaction.update(requestRef, {
      status: 'rejected',
      paymentStatus: 'rejected',
      rejectionReason: reason,
      processedAt: timestamp,
    });
    writeAudit(transaction, firestore, {
      adminId,
      targetType: 'visibilityRequest',
      targetId: requestId,
      action: 'reject_visibility',
      reason,
      createdAt: timestamp,
    });
  });
});

export function expiredVisibilityPatch() {
  return {
    visibilityTier: 'organic' as const,
    visibilityPaidUntil: null,
    paidVisibilityStartedAt: null,
    activeVisibilityRequestId: null,
    activeVisibilityProductId: null,
    activeVisibilityProductVersion: null,
  };
}

function areaExpansionExpiredProviderPatch(provider: ProviderRecord, serviceArea: string) {
  const serviceAreaKeys = (provider.serviceAreaKeys ?? []).filter((item) => item !== serviceArea);
  return {
    serviceAreaKeys,
    coverageAreaKeys: computeCoverageAreaKeys(
      serviceAreaKeys,
      getPlatformCoverageRadiusKm({
        city: provider.serviceAreas?.[0]?.city,
        profession: provider.profession,
        serviceAreaKey: provider.initialServiceAreaKey ?? serviceAreaKeys[0],
      }),
    ),
    serviceAreas: (provider.serviceAreas ?? []).filter((item) => item.neighborhood !== serviceArea),
  };
}

export const expirePaidVisibilityEntitlements = onSchedule('every 24 hours', async () => {
  const firestore = db();
  const now = new Date();
  const timestamp = now.toISOString();
  let paymobConfigured = true;
  try {
    validatePaymobConfig(paymobConfigFromEnv());
  } catch (error) {
    paymobConfigured = false;
    if (error instanceof PaymobConfigurationError) {
      logger.error('Paymob configuration missing for paid visibility renewal.', { missing: error.missing });
    } else {
      throw error;
    }
  }

  const gateway = paymobConfigured ? createPaymobGateway() : null;
  const expired = await firestore
    .collection('visibilityEntitlements')
    .where('status', '==', 'active')
    .where('endsAt', '<=', timestamp)
    .limit(50)
    .get();

  for (const entitlementSnapshot of expired.docs) {
    const entitlement = entitlementSnapshot.data() as VisibilityEntitlementRecord;
    const providerRef = firestore.collection('providers').doc(entitlement.providerId);
    const providerSnapshot = await providerRef.get();
    if (!providerSnapshot.exists) {
      await entitlementSnapshot.ref.update({
        status: 'expired',
        renewalStatus: 'failed',
        renewalFailureReason: 'provider_not_found',
      });
      continue;
    }
    const provider = providerSnapshot.data() as ProviderRecord;
    const decision = renewalDecision(entitlement, provider, paymobConfigured);
    if (decision.action === 'renew' && gateway && provider.paymobCardToken && decision.amountCents !== null) {
      const attemptId = renewalAttemptId(entitlement);
      const merchantOrderId = renewalMerchantOrderId(entitlement);
      const attemptRef = firestore.collection('visibilityRenewalAttempts').doc(attemptId);
      const attemptResult = await firestore.runTransaction(async (transaction) => {
        const currentAttempt = await transaction.get(attemptRef);
        if (currentAttempt.exists) return currentAttempt.data() as RenewalAttemptRecord;
        const attempt: RenewalAttemptRecord = {
          entitlementId: entitlementSnapshot.id,
          providerId: entitlement.providerId,
          requestId: entitlement.requestId,
          periodEndsAt: entitlement.endsAt,
          merchantOrderId,
          status: 'charging',
          amountCents: decision.amountCents!,
          currency: entitlement.productSnapshot?.currency ?? 'EGP',
          chargeReference: null,
          rawStatus: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        transaction.set(attemptRef, attempt);
        return attempt;
      });

      if (attemptResult.status === 'approved') {
        const renewedUntil = approveVisibility(now, entitlement.productSnapshot?.durationDays ?? 30);
        await firestore.runTransaction(async (transaction) => {
          transaction.update(entitlementSnapshot.ref, {
            endsAt: renewedUntil,
            renewedAt: timestamp,
            renewalStatus: 'renewed',
            renewalFailureReason: null,
            paymentReference: attemptResult.chargeReference,
          });
          if (entitlement.type === 'boost') {
            transaction.update(providerRef, renewedProviderVisibilityPatch(entitlement, renewedUntil));
          }
        });
        continue;
      }
      if (attemptResult.status !== 'charging' || attemptResult.createdAt !== timestamp) {
        if (attemptResult.status === 'charging') {
          await attemptRef.update({
            status: 'failed',
            rawStatus: 'stale_charging_attempt',
            updatedAt: timestamp,
          });
          decision.reason = 'paymob_charge_stale';
        } else {
          continue;
        }
      } else {
        const ownerSnapshot = provider.userId
          ? await firestore.collection('users').doc(provider.userId).get()
          : null;
        try {
          const charge = await gateway.chargeSavedCard({
            providerId: entitlement.providerId,
            requestId: entitlement.requestId,
            merchantOrderId,
            amountCents: decision.amountCents,
            currency: entitlement.productSnapshot?.currency ?? 'EGP',
            cardToken: provider.paymobCardToken,
            billing: paymobBillingData(provider, ownerSnapshot?.data() as UserRecord | undefined),
          });
          if (charge.status === 'approved') {
            const renewedUntil = approveVisibility(now, entitlement.productSnapshot?.durationDays ?? 30);
            await firestore.runTransaction(async (transaction) => {
              transaction.update(attemptRef, {
                status: 'approved',
                chargeReference: charge.reference,
                rawStatus: charge.rawStatus ?? null,
                updatedAt: timestamp,
              });
              transaction.update(entitlementSnapshot.ref, {
                endsAt: renewedUntil,
                renewedAt: timestamp,
                renewalStatus: 'renewed',
                renewalFailureReason: null,
                paymentReference: charge.reference,
              });
              if (entitlement.type === 'boost') {
                transaction.update(providerRef, renewedProviderVisibilityPatch(entitlement, renewedUntil));
              }
            });
            continue;
          }
          await attemptRef.update({
            status: 'declined',
            chargeReference: charge.reference,
            rawStatus: charge.rawStatus ?? null,
            updatedAt: timestamp,
          });
          decision.reason = charge.rawStatus ?? 'paymob_charge_declined';
        } catch (error) {
          logger.error('Paymob renewal charge failed.', { attemptId, providerId: entitlement.providerId });
          await attemptRef.update({
            status: 'failed',
            rawStatus: error instanceof Error ? error.message : 'paymob_charge_failed',
            updatedAt: timestamp,
          });
          decision.reason = 'paymob_charge_failed';
        }
      }
    }

    await firestore.runTransaction(async (transaction) => {
      const currentProvider = await transaction.get(providerRef);
      const currentData = currentProvider.data() as ProviderRecord | undefined;
      transaction.update(entitlementSnapshot.ref, {
        status: 'expired',
        renewalStatus: decision.reason === 'paymob_config_missing' ? 'not_configured' : 'failed',
        renewalFailureReason: decision.reason,
      });
      if (entitlement.type === 'area_expansion' && currentData) {
        transaction.update(providerRef, areaExpansionExpiredProviderPatch(currentData, entitlement.serviceArea));
      } else if (currentData?.activeVisibilityRequestId === entitlement.requestId) {
        transaction.update(providerRef, expiredVisibilityPatch());
      }
    });
  }
});
