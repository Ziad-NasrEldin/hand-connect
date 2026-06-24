import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { isPotentialLeadSpam } from './abuse.js';
import { writeAnalyticsEvent } from './analytics.js';
import { requirePublicApprovedProvider } from './provider-visibility.js';

const dayMs = 24 * 60 * 60 * 1000;
const hourMs = 60 * 60 * 1000;
const limits = { whatsappReveals: 20, conversationStarts: 20, reports: 10 };

export function isMessageRateLimited(recentMessagesInHour: number) {
  return isPotentialLeadSpam(0, recentMessagesInHour + 1);
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

function readString(value: unknown, field: string, maxLength = 4000) {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `${field} is required.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) throw new HttpsError('invalid-argument', `${field} is invalid.`);
  return trimmed;
}

async function requireActiveUser(firestore: Firestore, uid: string) {
  const user = await firestore.collection('users').doc(uid).get();
  if (!user.exists || user.data()?.status === 'banned') {
    throw new HttpsError('permission-denied', 'Active account is required.');
  }
  return user.data() ?? {};
}

async function assertDailyReportLimit(firestore: Firestore, reporterId: string) {
  const since = new Date(Date.now() - dayMs).toISOString();
  const reports = await firestore
    .collection('reports')
    .where('reporterId', '==', reporterId)
    .where('createdAt', '>=', since)
    .get();
  if (reports.size >= limits.reports) throw new HttpsError('resource-exhausted', 'error.rateLimit.exceeded');
}

function whatsappUrl(number: string) {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    throw new HttpsError('failed-precondition', 'WhatsApp contact is unavailable.');
  }
  return `https://wa.me/${digits}`;
}

export const revealWhatsApp = onCall(async (request) => {
  const customerId = requireAuth(request);
  const providerId = readString(request.data?.providerId, 'providerId', 120);
  const firestore = db();
  await requireActiveUser(firestore, customerId);

  const provider = await requirePublicApprovedProvider(firestore, providerId);
  if (!provider.data()?.whatsappVisible) throw new HttpsError('failed-precondition', 'WhatsApp contact is unavailable.');

  const contactId = `${customerId}_${providerId}_whatsapp_reveal`;
  const contactRef = firestore.collection('contacts').doc(contactId);
  const existing = await contactRef.get();
  if (!existing.exists) {
    const since = new Date(Date.now() - dayMs).toISOString();
    const recent = await firestore
      .collection('contacts')
      .where('customerId', '==', customerId)
      .where('type', '==', 'whatsapp_reveal')
      .where('createdAt', '>=', since)
      .get();
    if (recent.size >= limits.whatsappReveals) throw new HttpsError('resource-exhausted', 'error.rateLimit.exceeded');
    const timestamp = new Date().toISOString();
    await firestore.runTransaction(async (transaction) => {
      transaction.set(contactRef, {
        customerId,
        providerId,
        type: 'whatsapp_reveal',
        createdAt: timestamp,
        hasReview: false,
      });
      writeAnalyticsEvent(transaction, firestore, {
        type: 'whatsapp_reveal',
        actorId: customerId,
        targetType: 'provider',
        targetId: providerId,
        metadata: { contactId },
        createdAt: timestamp,
      });
    });
  }

  const contact = await contactRef.get();
  return {
    provider: { id: provider.id, ...provider.data() },
    contact: { id: contact.id, ...contact.data() },
    whatsappUrl: whatsappUrl(String(provider.data()?.whatsappNumber ?? '')),
  };
});

export const startConversation = onCall(async (request) => {
  const customerId = requireAuth(request);
  const providerId = readString(request.data?.providerId, 'providerId', 120);
  const text = readString(request.data?.text, 'text', 4000);
  const firestore = db();
  await requireActiveUser(firestore, customerId);

  const provider = await requirePublicApprovedProvider(firestore, providerId);
  const providerUserId = String(provider.data()?.userId ?? providerId);
  const conversationId = `${customerId}_${providerId}`;
  const conversationRef = firestore.collection('conversations').doc(conversationId);
  const messageRef = conversationRef.collection('messages').doc();
  const contactRef = firestore.collection('contacts').doc(`${customerId}_${providerId}_platform_message`);
  const timestamp = new Date().toISOString();

  if (!(await conversationRef.get()).exists) {
    const since = new Date(Date.now() - dayMs).toISOString();
    const recent = await firestore
      .collection('conversations')
      .where('customerId', '==', customerId)
      .where('lastMessageAt', '>=', since)
      .get();
    if (recent.size >= limits.conversationStarts) throw new HttpsError('resource-exhausted', 'error.rateLimit.exceeded');
  }

  await firestore.runTransaction(async (transaction) => {
    const conversation = await transaction.get(conversationRef);
    const contact = await transaction.get(contactRef);
    if (!conversation.exists) {
      transaction.set(conversationRef, {
        participants: [customerId, providerUserId],
        providerId,
        customerId,
        lastMessage: text,
        lastMessageAt: timestamp,
        unreadCount: { [providerUserId]: 1, [customerId]: 0 },
      });
    } else {
      const current = conversation.data() ?? {};
      transaction.update(conversationRef, {
        lastMessage: text,
        lastMessageAt: timestamp,
        [`unreadCount.${providerUserId}`]: Number(current.unreadCount?.[providerUserId] ?? 0) + 1,
      });
    }
    transaction.set(messageRef, { conversationId, senderId: customerId, text, createdAt: timestamp, read: false });
    if (!contact.exists) {
      transaction.set(contactRef, { customerId, providerId, type: 'platform_message', createdAt: timestamp, hasReview: false });
      writeAnalyticsEvent(transaction, firestore, {
        type: 'chat_initiated',
        actorId: customerId,
        targetType: 'provider',
        targetId: providerId,
        metadata: { conversationId },
        createdAt: timestamp,
      });
    }
  });

  const conversation = await conversationRef.get();
  return { id: conversation.id, ...conversation.data() };
});

export const sendMessage = onCall(async (request) => {
  const senderId = requireAuth(request);
  const conversationId = readString(request.data?.conversationId, 'conversationId', 240);
  const text = readString(request.data?.text, 'text', 4000);
  const firestore = db();
  await requireActiveUser(firestore, senderId);

  const conversationRef = firestore.collection('conversations').doc(conversationId);
  const conversation = await conversationRef.get();
  if (!conversation.exists || !conversation.data()?.participants?.includes(senderId)) {
    throw new HttpsError('not-found', 'Conversation not found.');
  }
  const providerId = conversation.data()?.providerId;
  if (typeof providerId === 'string') {
    await requirePublicApprovedProvider(firestore, providerId);
  }

  const since = new Date(Date.now() - hourMs).toISOString();
  const recentMessages = await firestore
    .collectionGroup('messages')
    .where('senderId', '==', senderId)
    .where('createdAt', '>=', since)
    .get();
  if (isMessageRateLimited(recentMessages.size)) {
    throw new HttpsError('resource-exhausted', 'error.rateLimit.exceeded');
  }

  const messageRef = conversationRef.collection('messages').doc();
  const timestamp = new Date().toISOString();
  const message = await firestore.runTransaction(async (transaction) => {
    const current = await transaction.get(conversationRef);
    if (!current.exists || !current.data()?.participants?.includes(senderId)) {
      throw new HttpsError('not-found', 'Conversation not found.');
    }
    const currentProviderId = current.data()?.providerId;
    if (typeof currentProviderId === 'string') {
      await requirePublicApprovedProvider(firestore, currentProviderId);
    }
    const participants = current.data()?.participants as string[];
    const recipientId = participants.find((item) => item !== senderId);
    if (!recipientId) throw new HttpsError('failed-precondition', 'Conversation recipient is unavailable.');
    const messageData = { conversationId, senderId, text, createdAt: timestamp, read: false };
    transaction.set(messageRef, messageData);
    transaction.update(conversationRef, {
      lastMessage: text,
      lastMessageAt: timestamp,
      [`unreadCount.${recipientId}`]: Number(current.data()?.unreadCount?.[recipientId] ?? 0) + 1,
    });
    return { id: messageRef.id, ...messageData };
  });

  return message;
});

export const reportProvider = onCall(async (request) => {
  const reporterId = requireAuth(request);
  const providerId = readString(request.data?.providerId, 'providerId', 120);
  const reason = readString(request.data?.reason, 'reason', 1000);
  const firestore = db();
  const reporter = await requireActiveUser(firestore, reporterId);
  const provider = await firestore.collection('providers').doc(providerId).get();
  if (!provider.exists) throw new HttpsError('not-found', 'Provider not found.');
  await assertDailyReportLimit(firestore, reporterId);
  await firestore.collection('reports').doc().set({
    targetType: 'provider',
    targetId: providerId,
    targetLabel: provider.data()?.displayName ?? null,
    reporterId,
    reporterName: reporter.displayName ?? null,
    reason,
    status: 'open',
    resolvedBy: null,
    resolvedAt: null,
    resolutionReason: null,
    createdAt: new Date().toISOString(),
  });
});

export const reportReview = onCall(async (request) => {
  const reporterId = requireAuth(request);
  const reviewId = readString(request.data?.reviewId, 'reviewId', 120);
  const reason = readString(request.data?.reason, 'reason', 1000);
  const firestore = db();
  const reporter = await requireActiveUser(firestore, reporterId);
  const review = await firestore.collection('reviews').doc(reviewId).get();
  if (!review.exists || review.data()?.status !== 'visible') throw new HttpsError('not-found', 'Review not found.');
  await assertDailyReportLimit(firestore, reporterId);
  await firestore.collection('reports').doc().set({
    targetType: 'review',
    targetId: reviewId,
    targetLabel: review.data()?.comment ?? null,
    reporterId,
    reporterName: reporter.displayName ?? null,
    reason,
    status: 'open',
    resolvedBy: null,
    resolvedAt: null,
    resolutionReason: null,
    createdAt: new Date().toISOString(),
  });
});

export const reportMessage = onCall(async (request) => {
  const reporterId = requireAuth(request);
  const conversationId = readString(request.data?.conversationId, 'conversationId', 240);
  const messageId = readString(request.data?.messageId, 'messageId', 120);
  const reason = readString(request.data?.reason, 'reason', 1000);
  const firestore = db();
  const reporter = await requireActiveUser(firestore, reporterId);
  const conversation = await firestore.collection('conversations').doc(conversationId).get();
  if (!conversation.exists || !conversation.data()?.participants?.includes(reporterId)) throw new HttpsError('not-found', 'Conversation not found.');
  const message = await conversation.ref.collection('messages').doc(messageId).get();
  if (!message.exists) throw new HttpsError('not-found', 'Message not found.');
  await assertDailyReportLimit(firestore, reporterId);
  await firestore.collection('reports').doc().set({
    targetType: 'message',
    targetId: messageId,
    targetLabel: message.data()?.text ?? null,
    reporterId,
    reporterName: reporter.displayName ?? null,
    reason,
    status: 'open',
    resolvedBy: null,
    resolvedAt: null,
    resolutionReason: null,
    createdAt: new Date().toISOString(),
  });
});
