import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { PageIntro } from '@/components/page-intro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getNeighborhoodName } from '@/config/neighborhoods';
import { useAuth } from '@/hooks/use-auth';
import { useOwnedProvider } from '@/hooks/use-provider-profile';
import {
  getVisibilityRequestNoteLabel,
  getVisibilityRequestStatusLabel,
} from '@/lib/display';
import { getProviderMetrics } from '@/services/analytics.service';
import { listProviderVisibilityRequests } from '@/services/visibility.service';
import type { VisibilityRequest } from '@/types/visibility';

function isPaidActive(paidUntil?: string | null) {
  return Boolean(paidUntil && new Date(paidUntil).getTime() > Date.now());
}

function latestRequest(requests: VisibilityRequest[] = []) {
  return [...requests].sort(
    (a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  )[0];
}

export function ProviderDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const provider = useOwnedProvider(user?.uid);
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const metrics = useQuery({
    queryKey: ['metrics', provider.data?.id],
    queryFn: () => getProviderMetrics(provider.data!.id),
    enabled: Boolean(provider.data?.id),
  });
  const requests = useQuery({
    queryKey: ['visibility', provider.data?.id],
    queryFn: () => listProviderVisibilityRequests(provider.data!.id),
    enabled: Boolean(provider.data?.id),
  });
  const latestVisibilityRequest = latestRequest(requests.data);
  const paidActive = isPaidActive(provider.data?.visibilityPaidUntil);
  const coverageAreas = provider.data?.coverageAreaKeys.length
    ? provider.data.coverageAreaKeys
    : provider.data?.serviceAreaKeys ?? [];
  const paidStatus = paidActive
    ? t('dashboard.paidActive')
    : latestVisibilityRequest?.status === 'pending'
      ? t('dashboard.paidPending')
      : t('dashboard.paidOrganic');

  const cards = [
    { label: t('dashboard.views'), value: provider.data?.profileViews ?? 0 },
    { label: t('dashboard.contacts'), value: metrics.data?.contactsCount ?? 0 },
    { label: t('dashboard.rating'), value: provider.data?.avgRating ?? 0 },
    { label: t('dashboard.conversations'), value: metrics.data?.conversationsCount ?? 0 },
    { label: t('dashboard.responseRate'), value: `${metrics.data?.responseRate ?? 0}%` },
    {
      label: t('dashboard.avgResponse'),
      value:
        metrics.data?.averageFirstResponseMinutes === null || metrics.data?.averageFirstResponseMinutes === undefined
          ? t('dashboard.noResponses')
          : t('dashboard.minutes', { count: metrics.data.averageFirstResponseMinutes }),
    },
  ];
  const chartCards = [
    { label: t('dashboard.views'), value: provider.data?.profileViews ?? 0 },
    { label: t('dashboard.contacts'), value: metrics.data?.contactsCount ?? 0 },
    { label: t('dashboard.conversations'), value: metrics.data?.conversationsCount ?? 0 },
  ];

  if (provider.isLoading) {
    return <p className="motion-reveal soft-note p-4 text-sm">{t('dashboard.loading')}</p>;
  }

  if (!provider.data) {
    return <p className="motion-reveal soft-note p-4 text-sm">{t('dashboard.notFound')}</p>;
  }

  return (
    <section className="motion-stagger space-y-6">
      <PageIntro
        eyebrow={t('dashboard.insights')}
        title={t('dashboard.title')}
      />
      <div className="motion-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="stat-tile">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                {card.label}
              </p>
              <p className="brand-number mt-2 text-3xl sm:text-4xl">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {metrics.isLoading ? (
        <p className="motion-reveal soft-note p-4 text-sm">{t('dashboard.metricsLoading')}</p>
      ) : null}
      {metrics.isError ? (
        <div className="motion-reveal soft-note flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>{t('dashboard.metricsError')}</span>
          <Button type="button" variant="secondary" onClick={() => void metrics.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}
      <div className="motion-stagger grid gap-4 xl:grid-cols-3">
        <Card className="motion-reveal" variant="subtle">
          <CardHeader>
            <CardTitle>{t('dashboard.paidVisibility')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-lg font-semibold text-foreground">{paidStatus}</p>
            {provider.data.visibilityPaidUntil ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.paidUntil', {
                  date: new Date(provider.data.visibilityPaidUntil).toLocaleDateString(),
                })}
              </p>
            ) : null}
            <p className="text-sm leading-7 text-muted-foreground">
              {t('dashboard.noPlacementGuarantee')}
            </p>
            <Button asChild variant="secondary">
              <Link to="/visibility">{t('dashboard.manageVisibility')}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="motion-reveal" variant="subtle">
          <CardHeader>
            <CardTitle>{t('dashboard.coverageStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.coverageRadius', {
                count: provider.data.coverageRadiusKm,
              })}
            </p>
            <div className="motion-stagger flex flex-wrap gap-2">
              {coverageAreas.map((area) => (
                <span key={area} className="motion-pop rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                  {getNeighborhoodName(area, language)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="motion-reveal" variant="subtle">
          <CardHeader>
            <CardTitle>{t('dashboard.latestVisibilityRequest')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {latestVisibilityRequest ? (
              <>
                <p className="font-semibold text-foreground">
                  {getVisibilityRequestStatusLabel(latestVisibilityRequest.status, t)}
                </p>
                <p className="text-muted-foreground">
                  {getNeighborhoodName(latestVisibilityRequest.serviceArea, language)}
                </p>
                {latestVisibilityRequest.rejectionReason ? (
                  <p className="motion-pop text-destructive">
                    {getVisibilityRequestNoteLabel(latestVisibilityRequest.rejectionReason, t)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">{t('dashboard.noVisibilityRequests')}</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="motion-reveal" variant="subtle">
        <CardHeader>
          <CardTitle>{t('dashboard.activity')}</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartCards}>
              <XAxis dataKey="label" />
              <YAxis />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="motion-reveal" variant="subtle">
        <CardHeader>
          <CardTitle>{t('dashboard.rankingGuidance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="motion-stagger grid gap-3 text-sm leading-7 text-muted-foreground md:grid-cols-2">
            <li>{t('dashboard.guidanceProfile')}</li>
            <li>{t('dashboard.guidanceResponse')}</li>
            <li>{t('dashboard.guidanceReviews')}</li>
            <li>{t('dashboard.guidanceCoverage')}</li>
          </ul>
        </CardContent>
      </Card>
      <Card className="motion-reveal" variant="subtle">
        <CardHeader>
          <CardTitle>{t('dashboard.latestReviews')}</CardTitle>
        </CardHeader>
        <CardContent className="motion-stagger space-y-3">
          {metrics.data?.latestReviews.length ? (
            metrics.data.latestReviews.map((review) => (
              <div key={review.id} className="soft-list-item p-4 sm:p-5">
                <p className="text-sm font-semibold text-primary">
                  {review.rating} / 5 - {review.customerName}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {review.comment}
                </p>
              </div>
            ))
          ) : (
            <p className="motion-reveal soft-note p-4 text-sm leading-7">
              {t('dashboard.noReviews')}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
