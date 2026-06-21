import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/db';
import { callFirebaseFunction } from '@/firebase/functions';
import { conversationConverter, messageConverter } from '@/firebase/converters';
import { nowIso } from '@/lib/dates';
import type { Conversation, Message } from '@/types/messaging';
import type { ConversationDetails, MessagingService } from '../contracts/messaging.contract';

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

export const firebaseMessagingService: MessagingService = {
  conversationIdFor: (customerId: string, providerId: string) => `${customerId}_${providerId}`,
  startConversation: async (customerId, providerId, text) => {
    return callFirebaseFunction<{ providerId: string; text: string }, Conversation>('startConversation', { providerId, text });
  },
  sendMessage: async (conversationId, senderId, text) => {
    const db = requireFirebaseDb();
    const conversationRef = doc(db, 'conversations', conversationId).withConverter(conversationConverter);
    const messageRef = doc(
      collection(db, 'conversations', conversationId, 'messages'),
      createId('message'),
    ).withConverter(messageConverter);
    const timestamp = nowIso();

    return runTransaction(db, async (transaction) => {
      const conversationSnapshot = await transaction.get(conversationRef);
      if (!conversationSnapshot.exists()) throw new Error('error.conversation.notFound');
      const conversation = conversationSnapshot.data();
      if (!conversation.participants.includes(senderId)) {
        throw new Error('error.conversation.notFound');
      }
      const recipientId = conversation.participants.find((item) => item !== senderId)!;
      const message: Message = {
        id: messageRef.id,
        conversationId,
        senderId,
        text,
        createdAt: timestamp,
        read: false,
      };
      transaction.set(messageRef, message);
      transaction.update(conversationRef, {
        lastMessage: text,
        lastMessageAt: timestamp,
        [`unreadCount.${recipientId}`]: (conversation.unreadCount[recipientId] ?? 0) + 1,
      });
      return message;
    });
  },
  listConversations: async (userId) => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(
        collection(db, 'conversations').withConverter(conversationConverter),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc'),
      ),
    );
    return snapshot.docs.map((item) => item.data());
  },
  getConversation: async (conversationId, userId) => {
    const db = requireFirebaseDb();
    const conversationSnapshot = await getDoc(
      doc(db, 'conversations', conversationId).withConverter(conversationConverter),
    );
    if (!conversationSnapshot.exists()) return null;
    const conversation = conversationSnapshot.data();
    if (!conversation.participants.includes(userId)) return null;

    const messagesSnapshot = await getDocs(
      query(
        collection(db, 'conversations', conversationId, 'messages').withConverter(messageConverter),
        orderBy('createdAt', 'asc'),
      ),
    );
    return {
      conversation,
      messages: messagesSnapshot.docs.map((item) => item.data()),
    };
  },
  subscribeConversations: (userId, listener) => {
    const db = requireFirebaseDb();
    return onSnapshot(
      query(
        collection(db, 'conversations').withConverter(conversationConverter),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc'),
      ),
      (snapshot) => listener(snapshot.docs.map((item) => item.data())),
    );
  },
  subscribeConversation: (conversationId, userId, listener) => {
    const db = requireFirebaseDb();
    const conversationRef = doc(db, 'conversations', conversationId).withConverter(conversationConverter);
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages').withConverter(messageConverter),
      orderBy('createdAt', 'asc'),
    );
    let conversation: Conversation | null = null;
    let messages: Message[] = [];
    const emit = () => {
      const details: ConversationDetails | null = conversation?.participants.includes(userId)
        ? { conversation, messages }
        : null;
      listener(details);
    };
    const unsubscribeConversation = onSnapshot(conversationRef, (snapshot) => {
      conversation = snapshot.exists() ? snapshot.data() : null;
      emit();
    });
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      messages = snapshot.docs.map((item) => item.data());
      emit();
    });
    return () => {
      unsubscribeConversation();
      unsubscribeMessages();
    };
  },
  markConversationRead: async (conversationId, userId) => {
    const db = requireFirebaseDb();
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`unreadCount.${userId}`]: 0,
    });

    const messagesSnapshot = await getDocs(
      query(
        collection(db, 'conversations', conversationId, 'messages').withConverter(messageConverter),
        where('senderId', '!=', userId),
      ),
    );
    await Promise.all(messagesSnapshot.docs.map((item) => updateDoc(item.ref, { read: true })));
  },
  reportMessage: async (reporterId, messageId, reason) => {
    const db = requireFirebaseDb();
    const conversations = await getDocs(query(
      collection(db, 'conversations').withConverter(conversationConverter),
      where('participants', 'array-contains', reporterId),
    ));
    const messageSnapshots = await Promise.all(
      conversations.docs.map((conversation) => getDoc(
        doc(db, 'conversations', conversation.id, 'messages', messageId).withConverter(messageConverter),
      )),
    );
    const message = messageSnapshots.find((item) => item.exists());
    if (!message) throw new Error('error.message.notFound');
    await callFirebaseFunction<{ conversationId: string; messageId: string; reason: string }, void>('reportMessage', {
      conversationId: message.data().conversationId,
      messageId,
      reason,
    });
  },
};
