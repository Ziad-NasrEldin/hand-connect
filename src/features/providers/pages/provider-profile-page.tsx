import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
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
  const location = useLocation();
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
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);

  useEffect(() => {
    if (id) void incrementProfileView(id, user?.uid);
  }, [id, user?.uid]);

  if (!providerQuery.data)
    return <EmptyState asPageTitle title={t('provider.unavailable')} />;
  const provider = providerQuery.data;
  const paidActive = isPaidVisibilityActive(provider);
  const visibleReviews = reviewsQuery.data ?? [];
  const hasVisibleReviews = visibleReviews.length > 0;
  const ratingLabel = hasVisibleReviews
    ? t('reviews.ratingSummary', {
        rating: provider.avgRating.toFixed(1),
        count: provider.reviewCount,
      })
    : t('reviews.empty');

  function navigateToLogin() {
    return navigate('/login', { state: { returnTo: location.pathname } });
  }

  function readableError(error: unknown, fallbackKey: string) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('error.')) return t(message);
    return t(fallbackKey);
  }

  async function reveal() {
    if (!user) return navigateToLogin();
    if (isRevealing) return;
    setIsRevealing(true);
    setContactError(null);
    setContactStatus(null);
    try {
      const result = await revealWhatsApp(user.uid, provider.id);
      setRevealed({
        number: result.provider.whatsappNumber,
        url: result.whatsappUrl,
      });
      setContactStatus(t('provider.whatsappRevealed'));
      void queryClient.invalidateQueries({ queryKey: ['contact-check'] });
    } catch (error) {
      setContactError(readableError(error, 'provider.whatsappRevealFailed'));
    } finally {
      setIsRevealing(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    await sendQuickMessage();
  }

  async function sendQuickMessage() {
    if (!user) return navigateToLogin();
    if (user.role !== 'customer') return;
    if (!message.trim()) {
      setContactError(t('provider.messageRequired'));
      return;
    }
    if (isSending) return;
    setIsSending(true);
    setContactError(null);
    setContactStatus(null);
    try {
      const conversation = await startConversation(
        user.uid,
        provider.id,
        message,
      );
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      setContactError(readableError(error, 'provider.messageFailed'));
    } finally {
      setIsSending(false);
    }
  }

  async function report(reviewId: string) {
    if (!user) return navigateToLogin();
    setPendingReportId(reviewId);
    setReportStatus(null);
    setReportError(null);
    try {
      await reportReview(user.uid, reviewId, 'report.reason.reviewContainsPersonalAttack');
      setReportStatus(t('reviews.reportSubmitted'));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    } catch (error) {
      setReportError(readableError(error, 'reviews.reportFailed'));
    } finally {
      setPendingReportId(null);
    }
  }

  async function reportCurrentProvider() {
    if (!user) return navigateToLogin();
    setPendingReportId(provider.id);
    setReportStatus(null);
    setReportError(null);
    try {
      await reportProvider(user.uid, provider.id, 'report.reason.providerIssue');
      setReportStatus(t('provider.reportSubmitted'));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    } catch (error) {
      setReportError(readableError(error, 'provider.reportFailed'));
    } finally {
      setPendingReportId(null);
    }
  }

  return (
    <div className="motion-stagger grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="motion-stagger space-y-5">
        <Card
          className="motion-reveal"
          variant={paidActive ? 'highlight' : 'default'}
        >
          <CardContent className="space-y-5 p-6">
            <div>
              <div className="brand-eyebrow mb-6" />
              {provider.photos[0] ? (
                <img
                  src={provider.photos[0].url}
                  alt={provider.displayName}
                  className="motion-reveal mb-5 h-56 w-full rounded-3xl object-cover shadow-soft"
                />
              ) : null}
              <p className="section-label">{t('provider.eyebrow')}</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {provider.displayName}
              </h1>
              <p className="mt-3 text-lg font-semibold text-primary">
                {getProfessionName(provider.profession, language)}
              </p>
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                {ratingLabel}
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
            <p className="text-sm font-semibold text-muted-foreground">
              {t('provider.coverageRadius', { count: provider.coverageRadiusKm })}
            </p>
            <p className="motion-reveal soft-note p-4 text-sm leading-7">
              {t('provider.noGuarantee')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {provider.whatsappVisible ? (
                <Button
                  aria-label={t('provider.quickWhatsApp')}
                  className="w-full sm:w-auto"
                  disabled={isRevealing}
                  onClick={() => void reveal()}
                >
                  {isRevealing ? t('common.loading') : t('provider.whatsapp')}
                </Button>
              ) : null}
              <Button
                aria-label={t('provider.quickMessage')}
                className="w-full sm:w-auto"
                disabled={isSending}
                variant="outline"
                onClick={() => void sendQuickMessage()}
              >
                {isSending ? t('common.loading') : t('provider.message')}
              </Button>
            </div>
            {contactStatus ? (
              <p className="motion-pop soft-note p-3 text-sm font-semibold" role="status">
                {contactStatus}
              </p>
            ) : null}
            {contactError ? (
              <p className="motion-pop soft-note p-3 text-sm font-semibold text-destructive" role="alert">
                {contactError}
              </p>
            ) : null}
            {user ? (
              <Button
                className="h-auto px-0 py-0 text-xs underline"
                type="button"
                disabled={pendingReportId === provider.id}
                variant="ghost"
                onClick={() => void reportCurrentProvider()}
              >
                {t('provider.report')}
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card className="motion-reveal" variant="subtle">
          <CardHeader>
            <CardTitle>{t('reviews.title')}</CardTitle>
          </CardHeader>
          <CardContent className="motion-stagger space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {ratingLabel}
            </p>
            {reviewsQuery.isLoading ? (
              <p className="motion-reveal soft-note p-4 text-sm font-semibold" role="status">
                {t('reviews.loading')}
              </p>
            ) : null}
            {reviewsQuery.isError ? (
              <div className="motion-reveal soft-note space-y-3 p-4" role="alert">
                <p className="motion-pop text-sm font-semibold text-destructive">
                  {t('reviews.loadFailed')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void reviewsQuery.refetch()}
                >
                  {t('common.retry')}
                </Button>
              </div>
            ) : null}
            {visibleReviews.map((review) => (
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
                    disabled={pendingReportId === review.id}
                    variant="ghost"
                    onClick={() => void report(review.id)}
                  >
                    {t('reviews.report')}
                  </Button>
                ) : null}
              </div>
            ))}
            {!reviewsQuery.isLoading && !hasVisibleReviews ? (
              <p className="motion-reveal soft-note p-4 text-sm font-semibold">
                {t('reviews.empty')}
              </p>
            ) : null}
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
      <Card className="motion-reveal h-fit xl:sticky xl:top-28">
        <CardHeader>
          <CardTitle>{t('provider.contact')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {provider.whatsappVisible ? (
            <Button className="w-full" disabled={isRevealing} onClick={() => void reveal()}>
              {isRevealing ? t('common.loading') : t('provider.whatsapp')}
            </Button>
          ) : (
            <p className="motion-reveal soft-note p-4 text-center text-sm font-semibold">
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
          <form className="motion-stagger space-y-3" onSubmit={(event) => void send(event)}>
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button className="w-full" disabled={isSending} variant="outline" type="submit">
              {isSending ? t('common.loading') : t('provider.message')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
