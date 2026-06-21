import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { useProviderProfile } from '@/hooks/use-provider-profile';
import {
  incrementProfileView,
  reportProvider,
  revealWhatsApp,
} from '@/services/providers.service';
import { startConversation } from '@/services/messaging.service';
import { getProviderReviews, reportReview } from '@/services/reviews.service';
import { getNeighborhoodName } from '@/config/neighborhoods';
import { getProfessionName } from '@/config/professions';
import { isPaidVisibilityActive } from '@/lib/ranking';

interface RevealedWhatsApp {
  number: string;
  url: string;
}

export function ProviderProfilePage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const providerQuery = useProviderProfile(id);
  const reviewsQuery = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getProviderReviews(id!),
    enabled: Boolean(id),
  });
  const [message, setMessage] = useState(t('provider.defaultMessage'));
  const [revealed, setRevealed] = useState<RevealedWhatsApp | null>(null);

  useEffect(() => {
    if (id) void incrementProfileView(id, user?.uid);
  }, [id, user?.uid]);

  if (!providerQuery.data)
    return <EmptyState title={t('provider.unavailable')} />;
  const provider = providerQuery.data;
  const paidActive = isPaidVisibilityActive(provider);

  async function reveal() {
    if (!user) return navigate('/login');
    const result = await revealWhatsApp(user.uid, provider.id);
    setRevealed({
      number: result.provider.whatsappNumber,
      url: result.whatsappUrl,
    });
    void queryClient.invalidateQueries({ queryKey: ['contact-check'] });
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    await sendQuickMessage();
  }

  async function sendQuickMessage() {
    if (!user) return navigate('/login');
    if (user.role !== 'customer') return;
    const conversation = await startConversation(
      user.uid,
      provider.id,
      message,
    );
    navigate(`/messages/${conversation.id}`);
  }

  async function report(reviewId: string) {
    if (!user) return navigate('/login');
    await reportReview(user.uid, reviewId, 'report.reason.reviewContainsPersonalAttack');
    void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
  }

  async function reportCurrentProvider() {
    if (!user) return navigate('/login');
    await reportProvider(user.uid, provider.id, 'report.reason.providerIssue');
    void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
  }

  return (
    <div className="motion-stagger grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="motion-stagger space-y-5">
        <Card
          variant={paidActive ? 'highlight' : 'default'}
        >
          <CardContent className="space-y-5 p-6">
            <div>
              <div className="brand-eyebrow mb-6" />
              {provider.photos[0] ? (
                <img
                  src={provider.photos[0].url}
                  alt={provider.displayName}
                  className="mb-5 h-56 w-full rounded-3xl object-cover shadow-soft"
                />
              ) : null}
              <p className="section-label">{t('provider.eyebrow')}</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {provider.displayName}
              </h1>
              <p className="mt-3 text-lg font-semibold text-primary">
                {getProfessionName(provider.profession, language)}
              </p>
            </div>
            <p className="max-w-[65ch] leading-8 text-foreground/90">
              {provider.bio}
            </p>
            <div className="motion-stagger flex flex-wrap gap-2">
              {provider.serviceAreaKeys.map((area) => (
                <span
                  key={area}
                  className="motion-pop rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  {getNeighborhoodName(area, language)}
                </span>
              ))}
            </div>
            <p className="soft-note p-4 text-sm leading-7">
              {t('provider.noGuarantee')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {provider.whatsappVisible ? (
                <Button
                  aria-label={t('provider.quickWhatsApp')}
                  className="w-full sm:w-auto"
                  onClick={() => void reveal()}
                >
                  {t('provider.whatsapp')}
                </Button>
              ) : null}
              <Button
                aria-label={t('provider.quickMessage')}
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() => void sendQuickMessage()}
              >
                {t('provider.message')}
              </Button>
            </div>
            {user ? (
              <Button
                className="h-auto px-0 py-0 text-xs underline"
                type="button"
                variant="ghost"
                onClick={() => void reportCurrentProvider()}
              >
                {t('provider.report')}
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card variant="subtle">
          <CardHeader>
            <CardTitle>{t('reviews.title')}</CardTitle>
          </CardHeader>
          <CardContent className="motion-stagger space-y-3">
            {reviewsQuery.data?.map((review) => (
              <div key={review.id} className="soft-list-item p-4 sm:p-5">
                <p className="text-sm font-semibold text-primary">
                  {review.rating} / 5 - {review.customerName}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {review.comment}
                </p>
                {user ? (
                  <Button
                    className="mt-3 h-auto px-0 py-0 text-xs underline"
                    type="button"
                    variant="ghost"
                    onClick={() => void report(review.id)}
                  >
                    {t('reviews.report')}
                  </Button>
                ) : null}
              </div>
            ))}
            {user?.role === 'customer' ? (
              <Button asChild variant="outline">
                <Link to={`/reviews/new/${provider.id}`}>
                  {t('reviews.new')}
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>
      <Card className="h-fit xl:sticky xl:top-28">
        <CardHeader>
          <CardTitle>{t('provider.contact')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {provider.whatsappVisible ? (
            <Button className="w-full" onClick={() => void reveal()}>
              {t('provider.whatsapp')}
            </Button>
          ) : (
            <p className="soft-note p-4 text-center text-sm font-semibold">
              {t('provider.whatsappUnavailable')}
            </p>
          )}
          {revealed ? (
            <div className="motion-pop space-y-3 rounded-[calc(var(--radius)+2px)] border border-border bg-[color:var(--hc-surface)] p-4 text-center">
              <p className="text-base font-semibold">{revealed.number}</p>
              <Button asChild className="w-full" variant="outline">
                <a href={revealed.url} target="_blank" rel="noreferrer">
                  {t('provider.openWhatsApp')}
                </a>
              </Button>
            </div>
          ) : null}
          <form className="space-y-3" onSubmit={(event) => void send(event)}>
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button className="w-full" variant="outline" type="submit">
              {t('provider.message')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
