import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useConversation, useSendMessage } from '@/hooks/use-conversation';
import { cn } from '@/lib/cn';

export function ConversationPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const conversation = useConversation(id, user?.uid);
  const sendMessage = useSendMessage(id!);
  const [text, setText] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !text.trim()) return;
    sendMessage.mutate({ senderId: user.uid, text });
    setText('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('messages.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="motion-stagger grid min-h-[380px] content-end gap-3 rounded-[calc(var(--radius)+2px)] border border-border bg-[color:var(--hc-surface)] p-4 sm:p-5">
          {conversation.data?.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'message-bubble max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-[0_12px_24px_rgba(73,55,38,0.05)] sm:max-w-[75%]',
                message.senderId === user?.uid
                  ? 'justify-self-start bg-primary text-primary-foreground'
                  : 'justify-self-end border border-border bg-card text-foreground',
              )}
            >
              {message.text}
            </div>
          ))}
        </div>
        <form
          className="motion-stagger grid gap-2 md:grid-cols-[1fr_auto]"
          onSubmit={submit}
        >
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('messages.placeholder')}
          />
          <Button className="w-full md:w-auto" type="submit">
            {t('messages.send')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
