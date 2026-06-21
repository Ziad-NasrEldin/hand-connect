import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useVisibilityRequests } from '@/hooks/use-admin-actions';
import {
  getVisibilityRequestNoteLabel,
  getVisibilityRequestStatusLabel,
} from '@/lib/display';
import {
  approveVisibilityRequest,
  rejectVisibilityRequest,
} from '@/services/admin.service';

export function VisibilityRequestsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const requests = useVisibilityRequests();
  const queryClient = useQueryClient();
  async function approve(id: string) {
    await approveVisibilityRequest(
      user!.uid,
      id,
      'admin.reason.paymentConfirmed',
    );
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function reject(id: string) {
    await rejectVisibilityRequest(
      user!.uid,
      id,
      'admin.reason.paymentCouldNotBeMatched',
    );
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.visibility')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-3">
        {requests.data?.map((request) => (
          <div
            key={request.id}
            className="soft-list-item flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-foreground">
                {request.providerId}
              </p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {getVisibilityRequestStatusLabel(request.status, t)}
                {request.notes
                  ? ` - ${getVisibilityRequestNoteLabel(request.notes, t)}`
                  : ''}
              </p>
            </div>
            {request.status === 'pending' ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => void approve(request.id)}>
                  {t('admin.confirmPayment')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void reject(request.id)}
                >
                  {t('common.reject')}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
