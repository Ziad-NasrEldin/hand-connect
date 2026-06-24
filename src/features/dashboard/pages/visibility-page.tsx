import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getNeighborhoodName, neighborhoods } from '@/config/neighborhoods';
import { paidProducts } from '@/config/paid-products';
import { useAuth } from '@/hooks/use-auth';
import { useOwnedProvider } from '@/hooks/use-provider-profile';
import {
  getVisibilityRequestNoteLabel,
  getVisibilityRequestStatusLabel,
} from '@/lib/display';
import {
  createVisibilityRequest,
  completeVisibilityPayment,
  listProviderVisibilityRequests,
} from '@/services/visibility.service';

export function VisibilityPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const provider = useOwnedProvider(user?.uid);
  const queryClient = useQueryClient();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const requests = useQuery({
    queryKey: ['visibility', provider.data?.id],
    queryFn: () => listProviderVisibilityRequests(provider.data!.id),
    enabled: Boolean(provider.data?.id),
  });
  const [serviceArea, setServiceArea] = useState('new-cairo');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const isAreaExpansion = provider.data ? !provider.data.serviceAreaKeys.includes(serviceArea) : false;
  const canRequestAreaExpansion = !isAreaExpansion || (provider.data?.reviewCount ?? 0) >= 30;
  const activeProducts = [...paidProducts]
    .filter((product) => product.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const completeMockPayment = useCallback(async (requestId: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      await completeVisibilityPayment(requestId);
      setCheckoutRequestId(null);
      window.history.replaceState(null, '', '/visibility');
      void queryClient.invalidateQueries({ queryKey: ['visibility'] });
      void queryClient.invalidateQueries({ queryKey: ['provider'] });
    } catch {
      setError(t('visibility.paymentCompleteError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient, t]);

  useEffect(() => {
    const requestId = new URLSearchParams(window.location.search).get('paymob_mock_request');
    if (!requestId) return;
    void completeMockPayment(requestId);
  }, [completeMockPayment]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!provider.data) return;
    if (!canRequestAreaExpansion) {
      setError(t('visibility.areaExpansionLocked'));
      return;
    }
    setIsSubmitting(true);
    try {
      const request = await createVisibilityRequest(
        provider.data.id,
        serviceArea,
        'paymob_card',
        notes,
      );
      if (request.paymentSession?.mode === 'mock') {
        setCheckoutRequestId(request.id);
      } else if (request.paymentSession?.checkoutUrl) {
        window.location.assign(request.paymentSession.checkoutUrl);
      }
      setNotes('');
      void queryClient.invalidateQueries({ queryKey: ['visibility'] });
    } catch {
      setError(t('visibility.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="motion-reveal">
      <CardHeader>
        <CardTitle as="h1">{t('visibility.title')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-5">
        <p className="motion-reveal soft-note p-4 text-sm leading-7">
          {t('visibility.note')}
        </p>
        {provider.data ? (
          <div className="soft-list-item space-y-3 p-4 text-sm">
            <p className="font-semibold text-foreground">
              {t('visibility.currentCoverage')}
            </p>
            <p className="text-muted-foreground">
              {t('visibility.coverageRadius', {
                count: provider.data.coverageRadiusKm,
              })}
            </p>
            <div className="motion-stagger flex flex-wrap gap-2">
              {(provider.data.coverageAreaKeys.length
                ? provider.data.coverageAreaKeys
                : provider.data.serviceAreaKeys
              ).map((area) => (
                <span key={area} className="motion-pop rounded-md bg-muted px-2 py-1 text-xs font-semibold">
                  {getNeighborhoodName(area, language)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="motion-stagger grid gap-3 md:grid-cols-2">
          {activeProducts.map((product) => (
            <div key={product.id} className="soft-list-item p-4 text-sm leading-7">
              <p className="font-semibold text-foreground">
                {t(`visibility.product.${product.type}.title`)}
              </p>
              <p className="mt-1 text-muted-foreground">
                {t(`visibility.product.${product.type}.description`)}
              </p>
              <p className="mt-3 font-semibold text-foreground">
                {product.priceAmount === null
                  ? `${t('visibility.pricePending')} (${product.currency})`
                  : `${product.priceAmount} ${product.currency}`}
              </p>
              <p className="mt-1 text-muted-foreground">
                {t('visibility.durationDays', { count: product.durationDays })} -{' '}
                {t(`visibility.billing.${product.billingModel}`)}
              </p>
              <p className="mt-1 text-muted-foreground">
                {t(`visibility.renewalPolicy.${product.renewalPolicy}`)}
              </p>
            </div>
          ))}
        </div>
        {isAreaExpansion ? (
          <p className="motion-reveal soft-note p-4 text-sm leading-7">
            {canRequestAreaExpansion
              ? t('visibility.areaExpansionEligible')
              : t('visibility.areaExpansionLocked')}
          </p>
        ) : null}
        <form
          className="motion-stagger grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => void submit(event)}
        >
          <div className="space-y-2">
            <Label htmlFor="visibility-area">{t('auth.area')}</Label>
            <Select
              id="visibility-area"
              value={serviceArea}
              onChange={(event) => setServiceArea(event.target.value)}
              options={neighborhoods.map((area) => ({
                value: area.slug,
                label: language === 'ar' ? area.nameAr : area.nameEn,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visibility-notes">
              {t('visibility.notesPlaceholder')}
            </Label>
            <Textarea
              id="visibility-notes"
              className="min-h-[48px] resize-y"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('visibility.notesPlaceholder')}
            />
          </div>
          <Button className="w-full lg:w-auto" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('visibility.request')}
          </Button>
        </form>
        {error ? <p className="motion-pop text-sm text-destructive">{error}</p> : null}
        {checkoutRequestId ? (
          <div className="motion-reveal soft-note flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>{t('visibility.mockCheckoutReady')}</span>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => void completeMockPayment(checkoutRequestId)}
            >
              {t('visibility.completeMockPayment')}
            </Button>
          </div>
        ) : null}
        {requests.isLoading ? (
          <p className="motion-reveal soft-note p-4 text-sm">{t('visibility.historyLoading')}</p>
        ) : null}
        {requests.isError ? (
          <div className="motion-reveal soft-note flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>{t('visibility.historyError')}</span>
            <Button type="button" variant="secondary" onClick={() => void requests.refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : null}
        {requests.data?.length ? (
          requests.data.map((request) => (
            <div
              key={request.id}
              className="soft-list-item space-y-3 whitespace-pre-line p-4 text-sm text-foreground"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold">
                  {request.type === 'area_expansion'
                    ? t('visibility.type.areaExpansion')
                    : t('visibility.type.boost')}
                </p>
                <p className="text-muted-foreground">
                  {getVisibilityRequestStatusLabel(request.status, t)}
                </p>
              </div>
              <p className="text-muted-foreground">
                {getNeighborhoodName(request.serviceArea, language)}
              </p>
              <dl className="grid gap-2 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    {t('visibility.payment')}
                  </dt>
                  <dd>
                    {t(`visibility.paymentStatus.${request.paymentStatus}`)} -{' '}
                    {t(`visibility.paymentMethod.${request.paymentMethod}`)}
                  </dd>
                </div>
                {request.paymentSession ? (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {t('visibility.paymentSession')}
                    </dt>
                    <dd>
                      {t(`visibility.paymentSessionStatus.${request.paymentSession.status}`)} -{' '}
                      {t(`visibility.paymentMode.${request.paymentSession.mode}`)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    {t('visibility.product')}
                  </dt>
                  <dd>
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
                {request.paymentReference ? (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      {t('visibility.paymentReference')}
                    </dt>
                    <dd className="break-words [overflow-wrap:anywhere]">{request.paymentReference}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    {t('visibility.requestedAt')}
                  </dt>
                  <dd>{new Date(request.requestedAt).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    {t('visibility.processedAt')}
                  </dt>
                  <dd>
                    {request.processedAt
                      ? new Date(request.processedAt).toLocaleDateString()
                      : t('visibility.notProcessed')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">
                    {t('visibility.disclosure')}
                  </dt>
                  <dd>
                    {request.disclosureVersion
                      ? t('visibility.disclosureAccepted', {
                          version: request.disclosureVersion,
                        })
                      : t('visibility.disclosureMissing')}
                  </dd>
                </div>
              </dl>
              {request.notes ? (
                <p>{getVisibilityRequestNoteLabel(request.notes, t)}</p>
              ) : null}
              {request.rejectionReason ? (
                <p className="motion-pop text-destructive">
                  {getVisibilityRequestNoteLabel(request.rejectionReason, t)}
                </p>
              ) : null}
            </div>
          ))
        ) : requests.isSuccess ? (
          <p className="motion-reveal soft-note p-4 text-sm">{t('visibility.noRequests')}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
