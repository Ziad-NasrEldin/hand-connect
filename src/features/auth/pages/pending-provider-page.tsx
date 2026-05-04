import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getProviderStatusLabel } from '@/lib/display';

export function PendingProviderPage() {
  const { t } = useTranslation();
  const { providerStatus } = useAuth();
  return (
    <Card variant="subtle">
      <CardHeader>
        <div className="brand-eyebrow" />
        <p className="section-label">{t('auth.applicationStatus')}</p>
        <CardTitle>
          {providerStatus === 'rejected'
            ? t('auth.rejectedTitle')
            : t('auth.pendingTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-3 leading-8 text-muted-foreground">
        <p>{t('auth.pendingCopy')}</p>
        <p className="motion-pop soft-note p-4">
          {t('auth.currentStatus', {
            status: getProviderStatusLabel(providerStatus, t),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
