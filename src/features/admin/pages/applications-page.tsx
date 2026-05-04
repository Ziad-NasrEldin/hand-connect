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
    await rejectProvider(user!.uid, id, 'admin.reason.identityRejected');
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.applications')}</CardTitle>
      </CardHeader>
      <CardContent className="motion-stagger space-y-3">
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
              {provider.identityDocument ? (
                <div className="motion-reveal mt-3 grid gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {t('admin.identityDocument')}
                    </span>
                    <span>
                      {provider.identityDocument.fileName} -{' '}
                      {formatFileSize(provider.identityDocument.fileSize)}
                    </span>
                    <span>
                      {t('admin.identityUploadedAt', {
                        date: new Date(
                          provider.identityDocument.uploadedAt,
                        ).toLocaleString(language),
                      })}
                    </span>
                  </div>
                  {provider.identityDocument.fileType.startsWith('image/') ? (
                    <img
                      className="max-h-44 w-full rounded-lg border border-border object-contain"
                      src={provider.identityDocument.previewDataUrl}
                      alt={t('admin.identityDocument')}
                    />
                  ) : (
                    <a
                      className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                      href={provider.identityDocument.previewDataUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('admin.openIdentityDocument')}
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-destructive">
                  {t('admin.identityDocumentMissing')}
                </p>
              )}
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

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
