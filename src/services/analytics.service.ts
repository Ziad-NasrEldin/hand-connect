import { providerContacts } from './providers.service';
import { getProviderById } from './providers.service';
import { getConversation, listConversations } from './messaging.service';
import { getProviderReviews } from './reviews.service';
import type { Review } from '@/types/review';

export interface ProviderMetrics {
  contactsCount: number;
  conversationsCount: number;
  responseRate: number;
  averageFirstResponseMinutes: number | null;
  latestReviews: Review[];
}

export async function getProviderMetrics(providerId: string): Promise<ProviderMetrics> {
  const [contacts, provider, latestReviews] = await Promise.all([
    providerContacts(providerId),
    getProviderById(providerId),
    getProviderReviews(providerId),
  ]);
  const conversations = provider ? await listConversations(provider.userId) : [];
  const providerConversations = conversations.filter((conversation) => conversation.providerId === providerId);
  const conversationDetails = provider
    ? await Promise.all(providerConversations.map((conversation) => getConversation(conversation.id, provider.userId)))
    : [];
  const responseTimes = conversationDetails
    .map((details) => {
      if (!details || !provider) return null;
      const firstCustomerMessageIndex = details.messages.findIndex(
        (message) => message.senderId === details.conversation.customerId,
      );
      const firstCustomerMessage = details.messages[firstCustomerMessageIndex];
      const firstProviderResponse = firstCustomerMessage
        ? details.messages
            .slice(firstCustomerMessageIndex + 1)
            .find((message) => message.senderId === provider.userId)
        : null;
      if (!firstCustomerMessage || !firstProviderResponse) return null;
      return Math.max(
        0,
        Math.round(
          (new Date(firstProviderResponse.createdAt).getTime() -
            new Date(firstCustomerMessage.createdAt).getTime()) /
            60000,
        ),
      );
    })
    .filter((minutes): minutes is number => minutes !== null);

  return {
    contactsCount: contacts.length,
    conversationsCount: providerConversations.length,
    responseRate: providerConversations.length
      ? Math.round((responseTimes.length / providerConversations.length) * 100)
      : 0,
    averageFirstResponseMinutes: responseTimes.length
      ? Math.round(responseTimes.reduce((sum, item) => sum + item, 0) / responseTimes.length)
      : null,
    latestReviews: latestReviews.slice(0, 3),
  };
}
