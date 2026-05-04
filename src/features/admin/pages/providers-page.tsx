import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useAllProviders } from '@/hooks/use-admin-actions';
import { getProviderStatusLabel } from '@/lib/display';
import { suspendProvider } from '@/services/admin.service';

export function ProvidersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const query = useAllProviders();
  const queryClient = useQueryClient();
  async function suspend(id: string) {
    await suspendProvider(user!.uid, id, 'Manual admin suspension');
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.providers')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.data?.map((provider) => (
          <div
            key={provider.id}
            className="soft-list-item flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-foreground">
                {provider.displayName}
              </p>
              <p className="text-sm text-muted-foreground">
                {getProviderStatusLabel(provider.status, t)}
              </p>
            </div>
            {provider.status !== 'suspended' ? (
              <Button
                variant="destructive"
                onClick={() => void suspend(provider.id)}
              >
                {t('common.suspend')}
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
