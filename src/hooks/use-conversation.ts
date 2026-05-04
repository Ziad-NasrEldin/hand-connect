import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getConversation, listConversations, markConversationRead, sendMessage } from '@/services/messaging.service';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => listConversations(userId!),
    enabled: Boolean(userId),
    refetchInterval: 1500,
  });
}

export function useConversation(conversationId?: string, userId?: string) {
  return useQuery({
    queryKey: ['conversation', conversationId, userId],
    queryFn: async () => {
      const data = await getConversation(conversationId!, userId!);
      await markConversationRead(conversationId!, userId!);
      return data;
    },
    enabled: Boolean(conversationId && userId),
    refetchInterval: 1500,
  });
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
