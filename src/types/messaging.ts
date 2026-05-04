export interface Conversation {
  id: string;
  participants: string[];
  providerId: string;
  customerId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: Record<string, number>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
}
