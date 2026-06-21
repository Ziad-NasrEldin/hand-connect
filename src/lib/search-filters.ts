import { neighborhoods } from '@/config/neighborhoods';
import { professions as seededProfessions } from '@/config/professions';
import type { Profession } from '@/types/provider';

export interface SearchFilters {
  profession: string;
  neighborhood: string;
  limit: number;
}

export const defaultSearchLimit = 20;
export const maxSearchLimit = 50;

export const defaultSearchFilters: SearchFilters = {
  profession: 'plumbing',
  neighborhood: 'new-cairo',
  limit: defaultSearchLimit,
};

export function normalizeSearchFilters(
  input: Partial<SearchFilters>,
  availableProfessions: Profession[] = seededProfessions,
): SearchFilters {
  const activeProfessionSlugs = availableProfessions
    .filter((item) => item.active)
    .map((item) => item.slug);
  const professionFallback = activeProfessionSlugs.includes(defaultSearchFilters.profession)
    ? defaultSearchFilters.profession
    : (activeProfessionSlugs[0] ?? defaultSearchFilters.profession);
  const neighborhoodSlugs = neighborhoods.map((item) => item.slug);

  return {
    profession: input.profession && activeProfessionSlugs.includes(input.profession)
      ? input.profession
      : professionFallback,
    neighborhood: input.neighborhood && neighborhoodSlugs.includes(input.neighborhood)
      ? input.neighborhood
      : defaultSearchFilters.neighborhood,
    limit: normalizeSearchLimit(input.limit),
  };
}

export function normalizeSearchLimit(limit: number | undefined) {
  if (!limit || !Number.isFinite(limit)) return defaultSearchLimit;
  return Math.min(Math.max(Math.floor(limit), 1), maxSearchLimit);
}
