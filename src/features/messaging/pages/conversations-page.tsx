import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useConversations } from '@/hooks/use-conversation';

export function ConversationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const conversations = useConversations(user?.uid);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('messages.title')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-3">
        {conversations.data?.length === 0 ? (
          <EmptyState title={t('messages.empty')} />
        ) : null}
        {conversations.data?.map((conversation) => (
          <Link
            key={conversation.id}
            to={`/messages/${conversation.id}`}
            className="soft-list-item block p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--hc-cream)] sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-foreground">{conversation.id}</p>
              {user && conversation.unreadCount[user.uid] ? (
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                  {conversation.unreadCount[user.uid]}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {conversation.lastMessage}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
