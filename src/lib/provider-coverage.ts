import { neighborhoods } from '@/config/neighborhoods';
import { distanceKm, getNeighborhoodCoordinates } from './location';
import type { ProviderProfile } from '@/types/provider';

export const defaultCoverageRadiusKm = 8;
export const minCoverageRadiusKm = 1;
export const maxCoverageRadiusKm = 25;

const professionCoverageRadiusKm: Record<string, number> = {
  cleaning: 5,
  electrical: 10,
  painting: 8,
  plumbing: 12,
};

const outerNeighborhoodCoverageRadiusKm: Record<string, number> = {
  'new-cairo': 14,
  shorouk: 14,
};

export function getPlatformCoverageRadiusKm(input: {
  city?: string;
  profession?: string;
  serviceAreaKey?: string;
}) {
  if (input.city && input.city !== 'cairo') return defaultCoverageRadiusKm;
  return (
    outerNeighborhoodCoverageRadiusKm[input.serviceAreaKey ?? ''] ??
    professionCoverageRadiusKm[input.profession ?? ''] ??
    defaultCoverageRadiusKm
  );
}

export function normalizeCoverageRadiusKm(value: unknown) {
  const radius = typeof value === 'number' ? value : defaultCoverageRadiusKm;
  if (!Number.isFinite(radius)) return defaultCoverageRadiusKm;
  return Math.min(maxCoverageRadiusKm, Math.max(minCoverageRadiusKm, radius));
}

export function computeCoverageAreaKeys(
  serviceAreaKeys: string[],
  radiusKm = defaultCoverageRadiusKm,
) {
  const normalizedRadius = normalizeCoverageRadiusKm(radiusKm);
  const centers = serviceAreaKeys
    .map((key) => neighborhoods.find((item) => item.slug === key))
    .filter((item): item is (typeof neighborhoods)[number] => Boolean(item));

  const covered = new Set(serviceAreaKeys);
  for (const area of neighborhoods) {
    if (
      centers.some(
        (center) =>
          distanceKm(
            { lat: center.coordinates.lat, lng: center.coordinates.lng },
            { lat: area.coordinates.lat, lng: area.coordinates.lng },
          ) <= normalizedRadius,
      )
    ) {
      covered.add(area.slug);
    }
  }
  return [...covered].sort();
}

export function getProviderCoverageDistanceKm(
  provider: Pick<ProviderProfile, 'serviceAreaKeys'>,
  neighborhood: string,
) {
  const target = getNeighborhoodCoordinates(neighborhood);
  if (!target) return null;

  const distances = provider.serviceAreaKeys
    .map(getNeighborhoodCoordinates)
    .filter((coords): coords is NonNullable<typeof coords> => Boolean(coords))
    .map((coords) => distanceKm(coords, target));

  if (!distances.length) return null;
  return Math.min(...distances);
}

export function getCoverageAreaKeys(provider: ProviderProfile) {
  const radius = getPlatformCoverageRadiusKm({
    city: provider.serviceAreas[0]?.city,
    profession: provider.profession,
    serviceAreaKey: provider.initialServiceAreaKey || provider.serviceAreaKeys[0],
  });
  return provider.coverageAreaKeys.length
    ? provider.coverageAreaKeys
    : computeCoverageAreaKeys(provider.serviceAreaKeys, radius);
}

export function providerCoversNeighborhood(provider: ProviderProfile, neighborhood: string) {
  if (getCoverageAreaKeys(provider).includes(neighborhood)) return true;

  const distance = getProviderCoverageDistanceKm(provider, neighborhood);
  return distance !== null && distance <= getPlatformCoverageRadiusKm({
    city: provider.serviceAreas[0]?.city,
    profession: provider.profession,
    serviceAreaKey: provider.initialServiceAreaKey || provider.serviceAreaKeys[0],
  });
}
