import type { MessagingService } from './contracts/messaging.contract';
import { getDataSource } from './data-source';
import * as demo from './demo/messaging.demo';
import { firebaseMessagingService } from './firebase/messaging.firebase';

const demoMessagingService: MessagingService = demo;

function messagingService(): MessagingService {
  return getDataSource() === 'firebase' ? firebaseMessagingService : demoMessagingService;
}

export function conversationIdFor(customerId: string, providerId: string) {
  return messagingService().conversationIdFor(customerId, providerId);
}

export async function startConversation(customerId: string, providerId: string, text: string) {
  return messagingService().startConversation(customerId, providerId, text);
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  return messagingService().sendMessage(conversationId, senderId, text);
}

export async function listConversations(userId: string) {
  return messagingService().listConversations(userId);
}

export async function getConversation(conversationId: string, userId: string) {
  return messagingService().getConversation(conversationId, userId);
}

export function subscribeConversations(
  userId: string,
  listener: Parameters<MessagingService['subscribeConversations']>[1],
) {
  return messagingService().subscribeConversations(userId, listener);
}

export function subscribeConversation(
  conversationId: string,
  userId: string,
  listener: Parameters<MessagingService['subscribeConversation']>[2],
) {
  return messagingService().subscribeConversation(conversationId, userId, listener);
}

export async function markConversationRead(conversationId: string, userId: string) {
  return messagingService().markConversationRead(conversationId, userId);
}

export async function reportMessage(reporterId: string, messageId: string, reason: string) {
  return messagingService().reportMessage(reporterId, messageId, reason);
}
