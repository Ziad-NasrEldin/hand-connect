import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import { useReports } from '@/hooks/use-admin-actions';

export function ReportsPage() {
  const { t } = useTranslation();
  const reports = useReports();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.reports')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.data?.length ? (
          reports.data.map((report) => (
            <div key={report.id} className="soft-list-item p-4 sm:p-5">
              <p className="font-semibold text-foreground">{report.reason}</p>
            </div>
          ))
        ) : (
          <EmptyState title={t('admin.noOpenReports')} />
        )}
      </CardContent>
    </Card>
  );
}
