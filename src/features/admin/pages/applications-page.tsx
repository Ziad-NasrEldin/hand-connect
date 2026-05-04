import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getNeighborhoodName } from '@/config/neighborhoods';
import { getProfessionName } from '@/config/professions';
import { useAuth } from '@/hooks/use-auth';
import { useProviderApplications } from '@/hooks/use-admin-actions';
import { approveProvider, rejectProvider } from '@/services/admin.service';

export function ApplicationsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const query = useProviderApplications();
  const queryClient = useQueryClient();
  const language = i18n.language === 'en' ? 'en' : 'ar';

  async function approve(id: string) {
    await approveProvider(user!.uid, id);
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function reject(id: string) {
    await rejectProvider(
      user!.uid,
      id,
      'Identity information did not pass manual review',
    );
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.applications')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.data?.map((provider) => (
          <div
            key={provider.id}
            className="soft-list-item grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center"
          >
            <div>
              <p className="font-semibold text-foreground">
                {provider.displayName}
              </p>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                {getProfessionName(provider.profession, language)} -{' '}
                {provider.serviceAreaKeys
                  .map((area) => getNeighborhoodName(area, language))
                  .join(language === 'ar' ? '، ' : ', ')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('admin.identityDocumentPlaceholder')}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <Button onClick={() => void approve(provider.id)}>
                {t('common.approve')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => void reject(provider.id)}
              >
                {t('common.reject')}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
