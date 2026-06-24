import { useState, useTransition } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { PageIntro } from '@/components/page-intro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { neighborhoods, getNeighborhoodName } from '@/config/neighborhoods';
import { getProfessionName } from '@/config/professions';
import { useSearchProviders } from '@/hooks/use-search-providers';
import { findNearestNeighborhood } from '@/lib/location';
import { isPaidVisibilityActive } from '@/lib/ranking';
import { normalizeSearchFilters } from '@/lib/search-filters';
import { listProfessions } from '@/services/search.service';
import type { ProviderProfile } from '@/types/provider';

export function SearchPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'ar';
  const [params, setParams] = useSearchParams();
  const [locationMessageKey, setLocationMessageKey] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [, startTransition] = useTransition();
  const professionsQuery = useQuery({
    queryKey: ['professions', 'active'],
    queryFn: listProfessions,
  });
  const professionOptions = professionsQuery.data ?? [];
  const filters = normalizeSearchFilters({
    profession: params.get('profession') ?? undefined,
    neighborhood: params.get('neighborhood') ?? undefined,
  }, professionOptions.length ? professionOptions : undefined);
  const { profession, neighborhood } = filters;
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

  function useCurrentLocation() {
    setLocationMessageKey(null);
    if (!navigator.geolocation) {
      setLocationMessageKey('search.locationUnavailable');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestNeighborhood({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        updateFilters({ neighborhood: nearest.slug });
        setLocationMessageKey('search.locationSelected');
        setIsLocating(false);
      },
      (error) => {
        setLocationMessageKey(
          error.code === error.PERMISSION_DENIED
            ? 'search.locationDenied'
            : 'search.locationUnavailable',
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  return (
    <div className="motion-stagger space-y-5 sm:space-y-7">
      <PageIntro
        eyebrow={t('search.eyebrow')}
        title={t('search.title')}
        lead={t('search.lead')}
      />
      <Card className="motion-reveal" variant="subtle">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-2.5 md:grid-cols-2">
            <Select
              aria-label={t('search.profession')}
              value={profession}
              onChange={(event) =>
                updateFilters({ profession: event.target.value })
              }
              options={professionOptions.map((item) => ({
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
          <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={useCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? t('search.locating') : t('search.useLocation')}
            </Button>
            {locationMessageKey ? (
              <p className="motion-pop text-sm text-muted-foreground" role="status">
                {t(locationMessageKey)}
              </p>
            ) : null}
          </div>
          {professionsQuery.isError ? (
            <p className="motion-pop mt-3 text-sm text-destructive" role="status">
              {t('search.professionLoadError')}
            </p>
          ) : null}
        </CardContent>
      </Card>
      {query.isLoading ? <LoadingState label={t('common.loading')} /> : null}
      {query.isError ? (
        <EmptyState title={t('search.error')}>
          <Button type="button" onClick={() => void query.refetch()}>
            {t('search.retry')}
          </Button>
        </EmptyState>
      ) : null}
      {query.data?.length === 0 ? (
        <EmptyState title={t('search.empty')} />
      ) : null}
      <div className="motion-stagger grid gap-4 sm:gap-5 md:grid-cols-2">
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
  const paidActive = isPaidVisibilityActive(provider);
  return (
    <Card
      className="motion-reveal"
      variant={paidActive ? 'highlight' : 'default'}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        {provider.photos[0] ? (
          <img
            src={provider.photos[0].url}
            alt={provider.displayName}
            className="motion-reveal h-44 w-full rounded-2xl object-cover"
          />
        ) : null}
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
          {paidActive ? (
            <span className="paid-badge rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-[inset_0_0_0_1px_rgba(233,179,137,0.8)]">
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
        <p className="text-sm font-semibold text-muted-foreground">
          {t('provider.coverageRadius', { count: provider.coverageRadiusKm })}
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
