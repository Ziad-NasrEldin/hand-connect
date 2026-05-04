import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import { useAuditLog } from '@/hooks/use-admin-actions';
import {
  getAdminActionLabel,
  getAdminReasonLabel,
  getAdminTargetTypeLabel,
} from '@/lib/display';

export function AuditLogPage() {
  const { t } = useTranslation();
  const actions = useAuditLog();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.actions')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-3">
        {actions.data?.length ? (
          actions.data.map((action) => (
            <div key={action.id} className="soft-list-item p-4 sm:p-5">
              <p className="font-semibold text-foreground">
                {getAdminActionLabel(action.action, t)}
              </p>
              <p className="text-sm text-muted-foreground">
                {getAdminTargetTypeLabel(action.targetType, t)}/
                {action.targetId} - {getAdminReasonLabel(action.reason, t)}
              </p>
            </div>
          ))
        ) : (
          <EmptyState title={t('admin.noActions')} />
        )}
      </CardContent>
    </Card>
  );
}
