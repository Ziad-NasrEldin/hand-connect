import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useHideReview, useReports, useResolveReport } from '@/hooks/use-admin-actions';
import { getReportReasonLabel } from '@/lib/display';

export function ReportsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const reports = useReports();
  const resolveReport = useResolveReport();
  const hideReview = useHideReview();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.reports')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-3">
        {reports.data?.length ? (
          reports.data.map((report) => (
            <div key={report.id} className="soft-list-item p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {getReportReasonLabel(report.reason, t)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {report.targetType} · {report.targetId} · {report.status}
                  </p>
                </div>
                {report.status === 'open' && user ? (
                  <div className="flex flex-wrap gap-2">
                    {report.targetType === 'review' ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          hideReview.mutate({
                            adminId: user.uid,
                            reviewId: report.targetId,
                            reportId: report.id,
                            reason: 'admin.reason.reviewHidden',
                          })
                        }
                      >
                        {t('admin.hideReview')}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        resolveReport.mutate({
                          adminId: user.uid,
                          reportId: report.id,
                          reason: 'admin.reason.reportResolved',
                        })
                      }
                    >
                      {t('admin.resolveReport')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState title={t('admin.noOpenReports')} />
        )}
      </CardContent>
    </Card>
  );
}
