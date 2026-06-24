import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useConversation, useReportMessage, useSendMessage } from '@/hooks/use-conversation';
import { cn } from '@/lib/cn';

export function ConversationPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const conversation = useConversation(id, user?.uid);
  const sendMessage = useSendMessage(id!);
  const reportMessage = useReportMessage();
  const [text, setText] = useState('');
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);

  function readableError(error: unknown, fallbackKey: string) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('error.')) return t(message);
    return t(fallbackKey);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !text.trim()) return;
    setSendError(null);
    sendMessage.mutate(
      { senderId: user.uid, text },
      {
        onSuccess: () => setText(''),
        onError: (error) => setSendError(readableError(error, 'messages.sendFailed')),
      },
    );
  }

  async function report(messageId: string) {
    if (!user || pendingReportId) return;
    setPendingReportId(messageId);
    setReportStatus(null);
    setReportError(null);
    try {
      await reportMessage.mutateAsync({
        reporterId: user.uid,
        messageId,
        reason: 'report.reason.messageAbuse',
      });
      setReportStatus(t('messages.reportSubmitted'));
    } catch (error) {
      setReportError(readableError(error, 'messages.reportFailed'));
    } finally {
      setPendingReportId(null);
    }
  }

  return (
    <Card className="motion-reveal">
      <CardHeader>
        <CardTitle as="h1">{t('messages.title')}</CardTitle>
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
              {message.senderId !== user?.uid && user ? (
                <Button
                  className="mt-2 h-auto px-0 py-0 text-xs underline"
                  type="button"
                  disabled={pendingReportId === message.id}
                  variant="ghost"
                  onClick={() => void report(message.id)}
                >
                  {t('messages.report')}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        {reportStatus ? (
          <p className="motion-pop soft-note p-3 text-sm font-semibold" role="status">
            {reportStatus}
          </p>
        ) : null}
        {reportError ? (
          <p className="motion-pop soft-note p-3 text-sm font-semibold text-destructive" role="alert">
            {reportError}
          </p>
        ) : null}
        {sendError ? (
          <p className="motion-pop soft-note p-3 text-sm font-semibold text-destructive" role="alert">
            {sendError}
          </p>
        ) : null}
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
