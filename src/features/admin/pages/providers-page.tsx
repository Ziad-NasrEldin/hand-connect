import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useAllProviders, useSetUserBanned } from '@/hooks/use-admin-actions';
import { getProviderStatusLabel } from '@/lib/display';
import { suspendProvider } from '@/services/admin.service';

export function ProvidersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const query = useAllProviders();
  const banMutation = useSetUserBanned();
  const queryClient = useQueryClient();
  async function suspend(id: string) {
    await suspendProvider(user!.uid, id, 'admin.reason.manualSuspension');
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }
  function setBanned(userId: string, banned: boolean) {
    banMutation.mutate({
      adminId: user!.uid,
      userId,
      banned,
      reason: banned ? 'admin.reason.manualBan' : 'admin.reason.manualUnban',
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.providers')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-3">
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
              <p className="text-xs text-muted-foreground">
                {provider.accountStatus === 'banned'
                  ? t('admin.accountBanned')
                  : t('admin.accountActive')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {provider.status !== 'suspended' ? (
                <Button
                  variant="destructive"
                  onClick={() => void suspend(provider.id)}
                >
                  {t('common.suspend')}
                </Button>
              ) : null}
              <Button
                variant={provider.accountStatus === 'banned' ? 'secondary' : 'destructive'}
                onClick={() => setBanned(provider.userId, provider.accountStatus !== 'banned')}
                disabled={banMutation.isPending}
              >
                {provider.accountStatus === 'banned' ? t('common.unban') : t('common.ban')}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
