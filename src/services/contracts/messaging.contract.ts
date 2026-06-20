import type { Conversation, Message } from '@/types/messaging';

export interface ConversationDetails {
  conversation: Conversation;
  messages: Message[];
}

export type ConversationListener = (details: ConversationDetails | null) => void;
export type ConversationsListener = (conversations: Conversation[]) => void;
export type Unsubscribe = () => void;

export interface MessagingService {
  conversationIdFor(customerId: string, providerId: string): string;
  startConversation(customerId: string, providerId: string, text: string): Promise<Conversation>;
  sendMessage(conversationId: string, senderId: string, text: string): Promise<Message>;
  listConversations(userId: string): Promise<Conversation[]>;
  getConversation(conversationId: string, userId: string): Promise<ConversationDetails | null>;
  subscribeConversations(userId: string, listener: ConversationsListener): Unsubscribe;
  subscribeConversation(conversationId: string, userId: string, listener: ConversationListener): Unsubscribe;
  markConversationRead(conversationId: string, userId: string): Promise<void>;
  reportMessage(reporterId: string, messageId: string, reason: string): Promise<void>;
}
