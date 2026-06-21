import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { PageIntro } from '@/components/page-intro';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useOwnedProvider } from '@/hooks/use-provider-profile';
import { getProviderMetrics } from '@/services/analytics.service';

export function ProviderDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const provider = useOwnedProvider(user?.uid);
  const metrics = useQuery({
    queryKey: ['metrics', provider.data?.id],
    queryFn: () => getProviderMetrics(provider.data!.id),
    enabled: Boolean(provider.data?.id),
  });

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
    { label: t('dashboard.rating'), value: provider.data?.avgRating ?? 0 },
  ];

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
      <Card variant="subtle">
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
      <Card variant="subtle">
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
            <p className="soft-note p-4 text-sm leading-7">
              {t('dashboard.noReviews')}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
