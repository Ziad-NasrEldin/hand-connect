import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminOverview } from '@/hooks/use-admin-actions';

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const overview = useAdminOverview();
  const items = [
    [t('admin.applications'), overview.data?.pendingApplications ?? 0],
    [t('admin.providers'), overview.data?.approvedProviders ?? 0],
    [t('admin.suspended'), overview.data?.suspendedProviders ?? 0],
    [t('admin.visibility'), overview.data?.pendingVisibility ?? 0],
    [t('admin.reviewsUnderReview'), overview.data?.reviewsUnderReview ?? 0],
  ];
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="brand-eyebrow mb-4" />
        <div className="space-y-2">
          <p className="section-label">{t('admin.overview')}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('admin.title')}
          </h1>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(([label, value]) => (
          <Card key={label} className="stat-tile">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-muted-foreground">
                {label}
              </p>
              <p className="brand-number mt-2 text-4xl sm:text-5xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
