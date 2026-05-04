import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
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
  ];

  return (
    <section className="motion-stagger space-y-6">
      <div className="motion-stagger space-y-4">
        <div className="brand-eyebrow mb-4" />
        <div className="space-y-2">
          <p className="section-label">{t('dashboard.insights')}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('dashboard.title')}
          </h1>
        </div>
      </div>
      <div className="motion-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="stat-tile">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                {card.label}
              </p>
              <p className="brand-number mt-2 text-4xl sm:text-5xl">
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
            <BarChart data={cards}>
              <XAxis dataKey="label" />
              <YAxis />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
