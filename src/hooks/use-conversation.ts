import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getConversation,
  listConversations,
  markConversationRead,
  reportMessage,
  sendMessage,
  subscribeConversation,
  subscribeConversations,
} from '@/services/messaging.service';

export function useConversations(userId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => listConversations(userId!),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!userId) return undefined;
    return subscribeConversations(userId, (conversations) => {
      queryClient.setQueryData(['conversations', userId], conversations);
    });
  }, [queryClient, userId]);

  return query;
}

export function useConversation(conversationId?: string, userId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['conversation', conversationId, userId],
    queryFn: async () => {
      const data = await getConversation(conversationId!, userId!);
      await markConversationRead(conversationId!, userId!);
      return data;
    },
    enabled: Boolean(conversationId && userId),
  });

  useEffect(() => {
    if (!conversationId || !userId) return undefined;
    return subscribeConversation(conversationId, userId, (details) => {
      queryClient.setQueryData(['conversation', conversationId, userId], details);
      if (details) void markConversationRead(conversationId, userId);
    });
  }, [conversationId, queryClient, userId]);

  return query;
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ senderId, text }: { senderId: string; text: string }) => sendMessage(conversationId, senderId, text),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useReportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reporterId, messageId, reason }: { reporterId: string; messageId: string; reason: string }) =>
      reportMessage(reporterId, messageId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}
