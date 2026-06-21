import { createId, readDb, writeDb } from './demo-db';
import type { Conversation, Message } from '@/types/messaging';
import { nowIso } from '@/lib/dates';
import { assertUnderDailyLimit, dailyRateLimits, isWithinLastDay } from '@/lib/rate-limits';
import type {
  ConversationDetails,
  ConversationListener,
  ConversationsListener,
} from '../contracts/messaging.contract';

export function conversationIdFor(customerId: string, providerId: string) {
  return `${customerId}_${providerId}`;
}

export async function startConversation(customerId: string, providerId: string, text: string) {
  const db = readDb();
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) throw new Error('error.provider.notFound');
  const id = conversationIdFor(customerId, providerId);
  let conversation = db.conversations.find((item) => item.id === id);
  const timestamp = nowIso();
  if (!conversation) {
    assertUnderDailyLimit(
      db.conversations.filter((item) => item.customerId === customerId && isWithinLastDay(item.lastMessageAt)).length,
      dailyRateLimits.conversationStarts,
    );
    conversation = {
      id,
      participants: [customerId, provider.userId],
      providerId,
      customerId,
      lastMessage: text,
      lastMessageAt: timestamp,
      unreadCount: { [provider.userId]: 1, [customerId]: 0 },
    };
    db.conversations.push(conversation);
  }
  if (!db.contacts.some((item) => item.customerId === customerId && item.providerId === providerId && item.type === 'platform_message')) {
    db.contacts.push({
      id: createId('contact'),
      customerId,
      providerId,
      type: 'platform_message',
      createdAt: timestamp,
      hasReview: false,
    });
  }
  const message: Message = {
    id: createId('message'),
    conversationId: id,
    senderId: customerId,
    text,
    createdAt: timestamp,
    read: false,
  };
  db.messages.push(message);
  conversation.lastMessage = text;
  conversation.lastMessageAt = timestamp;
  conversation.unreadCount[provider.userId] = (conversation.unreadCount[provider.userId] ?? 0) + 1;
  writeDb(db);
  return conversation;
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  const db = readDb();
  const conversation = db.conversations.find((item) => item.id === conversationId);
  if (!conversation || !conversation.participants.includes(senderId)) {
    throw new Error('error.conversation.notFound');
  }
  const recipientId = conversation.participants.find((item) => item !== senderId)!;
  const message: Message = {
    id: createId('message'),
    conversationId,
    senderId,
    text,
    createdAt: nowIso(),
    read: false,
  };
  db.messages.push(message);
  conversation.lastMessage = text;
  conversation.lastMessageAt = message.createdAt;
  conversation.unreadCount[recipientId] = (conversation.unreadCount[recipientId] ?? 0) + 1;
  writeDb(db);
  return message;
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  return readDb()
    .conversations.filter((item) => item.participants.includes(userId))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export async function getConversation(conversationId: string, userId: string): Promise<ConversationDetails | null> {
  const db = readDb();
  const conversation = db.conversations.find((item) => item.id === conversationId && item.participants.includes(userId));
  if (!conversation) return null;
  return {
    conversation,
    messages: db.messages.filter((item) => item.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export function subscribeConversations(userId: string, listener: ConversationsListener) {
  let active = true;
  async function emit() {
    if (!active) return;
    listener(await listConversations(userId));
  }
  void emit();
  const intervalId = window.setInterval(() => void emit(), 1500);
  return () => {
    active = false;
    window.clearInterval(intervalId);
  };
}

export function subscribeConversation(
  conversationId: string,
  userId: string,
  listener: ConversationListener,
) {
  let active = true;
  async function emit() {
    if (!active) return;
    listener(await getConversation(conversationId, userId));
  }
  void emit();
  const intervalId = window.setInterval(() => void emit(), 1500);
  return () => {
    active = false;
    window.clearInterval(intervalId);
  };
}

export async function markConversationRead(conversationId: string, userId: string) {
  const db = readDb();
  const conversation = db.conversations.find((item) => item.id === conversationId);
  if (!conversation) return;
  conversation.unreadCount[userId] = 0;
  db.messages.forEach((message) => {
    if (message.conversationId === conversationId && message.senderId !== userId) message.read = true;
  });
  writeDb(db);
}

export async function reportMessage(reporterId: string, messageId: string, reason: string) {
  const db = readDb();
  const message = db.messages.find((item) => item.id === messageId);
  if (!message) {
    throw new Error('error.message.notFound');
  }
  assertUnderDailyLimit(
    db.reports.filter((item) => item.reporterId === reporterId && isWithinLastDay(item.createdAt)).length,
    dailyRateLimits.reports,
  );
  db.reports.push({
    id: createId('report'),
    targetType: 'message',
    targetId: messageId,
    targetLabel: message.text,
    reporterId,
    reporterName: db.users.find((item) => item.uid === reporterId)?.displayName ?? null,
    reason,
    status: 'open',
    resolvedBy: null,
    resolvedAt: null,
    resolutionReason: null,
    createdAt: nowIso(),
  });
  writeDb(db);
}
