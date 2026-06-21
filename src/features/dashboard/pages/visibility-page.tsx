import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getNeighborhoodName, neighborhoods } from '@/config/neighborhoods';
import { useAuth } from '@/hooks/use-auth';
import { useOwnedProvider } from '@/hooks/use-provider-profile';
import {
  getVisibilityRequestNoteLabel,
  getVisibilityRequestStatusLabel,
} from '@/lib/display';
import {
  createVisibilityRequest,
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
  const isAreaExpansion = provider.data ? !provider.data.serviceAreaKeys.includes(serviceArea) : false;
  const canRequestAreaExpansion = !isAreaExpansion || (provider.data?.reviewCount ?? 0) >= 30;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!provider.data) return;
    if (!canRequestAreaExpansion) {
      setError(t('visibility.areaExpansionLocked'));
      return;
    }
    await createVisibilityRequest(
      provider.data.id,
      serviceArea,
      'manual',
      notes,
    );
    setNotes('');
    void queryClient.invalidateQueries({ queryKey: ['visibility'] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('visibility.title')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-5">
        <p className="soft-note p-4 text-sm leading-7">
          {t('visibility.note')}
        </p>
        {isAreaExpansion ? (
          <p className="soft-note p-4 text-sm leading-7">
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
          <Button className="w-full lg:w-auto" type="submit">
            {t('visibility.request')}
          </Button>
        </form>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {requests.data?.map((request) => (
          <div
            key={request.id}
            className="soft-list-item whitespace-pre-line p-4 text-sm font-semibold text-foreground"
          >
            {getNeighborhoodName(request.serviceArea, language)} -{' '}
            {getVisibilityRequestStatusLabel(request.status, t)}
            {request.notes
              ? ` - ${getVisibilityRequestNoteLabel(request.notes, t)}`
              : ''}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
