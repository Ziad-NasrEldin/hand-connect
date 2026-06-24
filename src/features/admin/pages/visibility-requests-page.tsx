import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getNeighborhoodName } from '@/config/neighborhoods';
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
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const requests = useVisibilityRequests();
  const queryClient = useQueryClient();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  async function approve(id: string) {
    setError('');
    setPendingActionId(id);
    try {
      await approveVisibilityRequest(
        user!.uid,
        id,
        reasonById[id]?.trim() || 'admin.reason.paymentConfirmed',
      );
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch {
      setError(t('admin.visibilityActionError'));
    } finally {
      setPendingActionId(null);
    }
  }

  async function reject(id: string) {
    setError('');
    setPendingActionId(id);
    try {
      await rejectVisibilityRequest(
        user!.uid,
        id,
        reasonById[id]?.trim() || 'admin.reason.paymentCouldNotBeMatched',
      );
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch {
      setError(t('admin.visibilityActionError'));
    } finally {
      setPendingActionId(null);
    }
  }
  return (
    <Card className="motion-reveal">
      <CardHeader>
        <CardTitle as="h1">{t('admin.visibility')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-3">
        {requests.isLoading ? (
          <p className="motion-reveal soft-note p-4 text-sm">{t('admin.visibilityLoading')}</p>
        ) : null}
        {requests.isError ? (
          <div className="motion-reveal soft-note flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>{t('admin.visibilityLoadError')}</span>
            <Button type="button" variant="secondary" onClick={() => void requests.refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : null}
        {error ? <p className="motion-pop text-sm text-destructive">{error}</p> : null}
        {requests.data?.map((request) => {
          const paymobRequiresCallback = request.paymentMethod === 'paymob_card' && request.paymentStatus !== 'matched';
          return (
            <div
              key={request.id}
              className="soft-list-item flex min-w-0 flex-col gap-4 overflow-hidden p-4"
            >
            <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="break-words font-semibold text-foreground">
                  {request.providerId}
                </p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {request.type === 'area_expansion'
                    ? t('visibility.type.areaExpansion')
                    : t('visibility.type.boost')}{' '}
                  - {getVisibilityRequestStatusLabel(request.status, t)}
                </p>
              </div>
              <p className="break-words [overflow-wrap:anywhere] text-sm text-muted-foreground">
                {getNeighborhoodName(request.serviceArea, language)}
              </p>
            </div>
            <dl className="grid min-w-0 gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t('visibility.payment')}
                </dt>
                <dd className="break-words [overflow-wrap:anywhere]">
                  {t(`visibility.paymentStatus.${request.paymentStatus}`)} -{' '}
                  {t(`visibility.paymentMethod.${request.paymentMethod}`)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t('visibility.product')}
                </dt>
                <dd className="break-words [overflow-wrap:anywhere]">
                  {request.productSnapshot
                    ? t('visibility.productSnapshot', {
                        days: request.productSnapshot.durationDays,
                        price:
                          request.productSnapshot.priceAmount ??
                          t('visibility.pricePending'),
                        currency: request.productSnapshot.currency,
                      })
                    : t('visibility.productPending')}
                  {request.productSnapshot
                    ? ` - ${t(`visibility.renewalPolicy.${request.productSnapshot.renewalPolicy}`)}`
                    : ''}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t('visibility.disclosure')}
                </dt>
                <dd className="break-words [overflow-wrap:anywhere]">
                  {request.disclosureVersion
                    ? t('visibility.disclosureAccepted', {
                        version: request.disclosureVersion,
                      })
                    : t('visibility.disclosureMissing')}
                </dd>
              </div>
              {request.paymentSession ? (
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">
                    {t('visibility.paymentSession')}
                  </dt>
                  <dd className="break-words [overflow-wrap:anywhere]">
                    {t(`visibility.paymentSessionStatus.${request.paymentSession.status}`)} -{' '}
                    {t(`visibility.paymentMode.${request.paymentSession.mode}`)}
                  </dd>
                </div>
              ) : null}
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t('visibility.requestedAt')}
                </dt>
                <dd className="break-words [overflow-wrap:anywhere]">
                  {new Date(request.requestedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
            {request.notes ? (
              <p className="break-words [overflow-wrap:anywhere] text-sm text-muted-foreground">
                {getVisibilityRequestNoteLabel(request.notes, t)}
              </p>
            ) : null}
            {request.paymentReference ? (
              <p className="break-words [overflow-wrap:anywhere] text-sm text-muted-foreground">
                {t('visibility.paymentReference')}: {request.paymentReference}
              </p>
            ) : null}
            {request.paymentSession?.merchantOrderId ? (
              <p className="break-words [overflow-wrap:anywhere] text-sm text-muted-foreground">
                {t('visibility.paymobMerchantOrder')}: {request.paymentSession.merchantOrderId}
              </p>
            ) : null}
            {request.rejectionReason ? (
              <p className="motion-pop break-words [overflow-wrap:anywhere] text-sm text-destructive">
                {getVisibilityRequestNoteLabel(request.rejectionReason, t)}
              </p>
            ) : null}
            {request.status === 'pending' ? (
              <div className="motion-reveal space-y-3">
                {paymobRequiresCallback ? (
                  <p className="soft-note p-3 text-sm text-muted-foreground">
                    {t('admin.paymobCallbackOnly')}
                  </p>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor={`visibility-reason-${request.id}`}>
                    {t('admin.actionReason')}
                  </Label>
                  <Textarea
                    id={`visibility-reason-${request.id}`}
                    value={reasonById[request.id] ?? ''}
                    onChange={(event) =>
                      setReasonById((current) => ({
                        ...current,
                        [request.id]: event.target.value,
                      }))
                    }
                    placeholder={t('admin.actionReasonPlaceholder')}
                  />
                </div>
                <div className="motion-stagger flex flex-col gap-2 sm:flex-row">
                  <Button
                    disabled={pendingActionId === request.id || paymobRequiresCallback}
                    onClick={() => void approve(request.id)}
                  >
                    {t('admin.confirmPayment')}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={pendingActionId === request.id}
                    onClick={() => void reject(request.id)}
                  >
                    {t('common.reject')}
                  </Button>
                </div>
              </div>
            ) : null}
            </div>
          );
        })}
        {requests.isSuccess && !requests.data?.length ? (
          <p className="motion-reveal soft-note p-4 text-sm">{t('admin.noVisibilityRequests')}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
