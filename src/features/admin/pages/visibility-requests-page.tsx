import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useVisibilityRequests } from '@/hooks/use-admin-actions';
import { getVisibilityRequestStatusLabel } from '@/lib/display';
import { approveVisibilityRequest } from '@/services/admin.service';

export function VisibilityRequestsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const requests = useVisibilityRequests();
  const queryClient = useQueryClient();
  async function approve(id: string) {
    await approveVisibilityRequest(user!.uid, id, 'Manual payment confirmed');
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.visibility')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.data?.map((request) => (
          <div
            key={request.id}
            className="soft-list-item flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-foreground">
                {request.providerId}
              </p>
              <p className="text-sm text-muted-foreground">
                {getVisibilityRequestStatusLabel(request.status, t)} -{' '}
                {request.notes}
              </p>
            </div>
            {request.status === 'pending' ? (
              <Button onClick={() => void approve(request.id)}>
                {t('admin.confirmPayment')}
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
