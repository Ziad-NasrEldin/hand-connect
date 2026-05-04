import { useTransition } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { neighborhoods, getNeighborhoodName } from '@/config/neighborhoods';
import { professions, getProfessionName } from '@/config/professions';
import { useSearchProviders } from '@/hooks/use-search-providers';
import type { ProviderProfile } from '@/types/provider';

export function SearchPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const [params, setParams] = useSearchParams();
  const [, startTransition] = useTransition();
  const profession = params.get('profession') ?? 'plumbing';
  const neighborhood = params.get('neighborhood') ?? 'new-cairo';
  const query = useSearchProviders({
    profession,
    neighborhood,
  });

  function updateFilters(next: { profession?: string; neighborhood?: string }) {
    startTransition(() => {
      setParams({
        profession: next.profession ?? profession,
        neighborhood: next.neighborhood ?? neighborhood,
      });
    });
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <div className="space-y-3">
        <div className="brand-eyebrow" />
        <div className="space-y-3">
          <p className="section-label">{t('search.eyebrow')}</p>
          <h1 className="page-title">{t('search.title')}</h1>
          <p className="page-lead">{t('search.lead')}</p>
        </div>
      </div>
      <Card variant="subtle">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-2.5 md:grid-cols-2">
            <Select
              aria-label={t('search.profession')}
              value={profession}
              onChange={(event) =>
                updateFilters({ profession: event.target.value })
              }
              options={professions.map((item) => ({
                value: item.slug,
                label: language === 'ar' ? item.nameAr : item.nameEn,
              }))}
            />
            <Select
              aria-label={t('search.area')}
              value={neighborhood}
              onChange={(event) =>
                updateFilters({ neighborhood: event.target.value })
              }
              options={neighborhoods.map((item) => ({
                value: item.slug,
                label: language === 'ar' ? item.nameAr : item.nameEn,
              }))}
            />
          </div>
        </CardContent>
      </Card>
      {query.isLoading ? <LoadingState label={t('common.loading')} /> : null}
      {query.data?.length === 0 ? (
        <EmptyState title={t('search.empty')} />
      ) : null}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        {query.data?.map((provider) => (
          <ProviderResultCard
            key={provider.id}
            provider={provider}
            language={language}
          />
        ))}
      </div>
    </div>
  );
}

function ProviderResultCard({
  provider,
  language,
}: {
  provider: ProviderProfile;
  language: 'ar' | 'en';
}) {
  const { t } = useTranslation();
  return (
    <Card
      variant={provider.visibilityTier === 'paid' ? 'highlight' : 'default'}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="brand-rule mb-4 w-28" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {provider.displayName}
            </h2>
            <p className="mt-2 text-sm font-semibold text-primary">
              {getProfessionName(provider.profession, language)}
            </p>
          </div>
          {provider.visibilityTier === 'paid' ? (
            <span className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-[inset_0_0_0_1px_rgba(233,179,137,0.8)]">
              {t('common.featured')}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm leading-7">{provider.bio}</p>
        <p className="text-sm text-muted-foreground">
          {provider.serviceAreaKeys
            .map((area) => getNeighborhoodName(area, language))
            .join(language === 'ar' ? '، ' : ', ')}
        </p>
        <div className="mt-auto flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="brand-number text-3xl">{provider.avgRating} / 5</p>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link to={`/providers/${provider.id}`}>
              {t('provider.viewProfile')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
