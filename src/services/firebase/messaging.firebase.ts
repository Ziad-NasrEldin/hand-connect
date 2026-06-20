import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/db';
import {
  abuseReportConverter,
  contactConverter,
  conversationConverter,
  messageConverter,
  providerConverter,
} from '@/firebase/converters';
import { nowIso } from '@/lib/dates';
import type { AbuseReport } from '@/types/admin';
import type { Contact } from '@/types/contact';
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

function platformContactId(customerId: string, providerId: string) {
  return `${customerId}_${providerId}_platform_message`;
}

export const firebaseMessagingService: MessagingService = {
  conversationIdFor: (customerId: string, providerId: string) => `${customerId}_${providerId}`,
  startConversation: async (customerId, providerId, text) => {
    const db = requireFirebaseDb();
    const providerRef = doc(db, 'providers', providerId).withConverter(providerConverter);
    const conversationId = firebaseMessagingService.conversationIdFor(customerId, providerId);
    const conversationRef = doc(db, 'conversations', conversationId).withConverter(conversationConverter);
    const messageRef = doc(
      collection(db, 'conversations', conversationId, 'messages'),
      createId('message'),
    ).withConverter(messageConverter);
    const contactRef = doc(db, 'contacts', platformContactId(customerId, providerId)).withConverter(contactConverter);
    const timestamp = nowIso();

    return runTransaction(db, async (transaction) => {
      const providerSnapshot = await transaction.get(providerRef);
      if (!providerSnapshot.exists() || providerSnapshot.data().status !== 'approved') {
        throw new Error('error.provider.notFound');
      }
      const provider = providerSnapshot.data();
      const conversationSnapshot = await transaction.get(conversationRef);
      const contactSnapshot = await transaction.get(contactRef);
      const existing = conversationSnapshot.exists() ? conversationSnapshot.data() : null;
      const conversation: Conversation = existing ?? {
        id: conversationId,
        participants: [customerId, provider.userId],
        providerId,
        customerId,
        lastMessage: text,
        lastMessageAt: timestamp,
        unreadCount: { [provider.userId]: 0, [customerId]: 0 },
      };
      const providerUnread = (conversation.unreadCount[provider.userId] ?? 0) + 1;
      const updatedConversation: Conversation = {
        ...conversation,
        lastMessage: text,
        lastMessageAt: timestamp,
        unreadCount: {
          ...conversation.unreadCount,
          [provider.userId]: providerUnread,
          [customerId]: conversation.unreadCount[customerId] ?? 0,
        },
      };
      const message: Message = {
        id: messageRef.id,
        conversationId,
        senderId: customerId,
        text,
        createdAt: timestamp,
        read: false,
      };
      transaction.set(conversationRef, updatedConversation);
      transaction.set(messageRef, message);
      if (!contactSnapshot.exists()) {
        const contact: Contact = {
          id: contactRef.id,
          customerId,
          providerId,
          type: 'platform_message',
          createdAt: timestamp,
          hasReview: false,
        };
        transaction.set(contactRef, contact);
      }
      return updatedConversation;
    });
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
    const reportRef = doc(collection(db, 'reports'), createId('report')).withConverter(abuseReportConverter);
    const report: AbuseReport = {
      id: reportRef.id,
      targetType: 'message',
      targetId: messageId,
      reporterId,
      reason,
      status: 'open',
      createdAt: nowIso(),
    };
    await setDoc(reportRef, report);
  },
};
