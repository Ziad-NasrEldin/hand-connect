import type { ProviderProfile } from '@/types/provider';
import { getPlatformCoverageRadiusKm, getProviderCoverageDistanceKm } from './provider-coverage';

export interface RankingInput {
  profession: string;
  neighborhood: string;
}

export function isPaidVisibilityActive(provider: ProviderProfile, now = new Date()) {
  return (
    provider.visibilityTier === 'paid' &&
    Boolean(provider.visibilityPaidUntil) &&
    new Date(provider.visibilityPaidUntil!).getTime() > now.getTime()
  );
}

export function providerRankingScore(provider: ProviderProfile, input: RankingInput) {
  const distance = getProviderCoverageDistanceKm(provider, input.neighborhood);
  const radius = getPlatformCoverageRadiusKm({
    city: provider.serviceAreas[0]?.city,
    profession: provider.profession,
    serviceAreaKey: provider.initialServiceAreaKey || provider.serviceAreaKeys[0],
  });
  const locationScore = distance === null
    ? 0
    : Math.max(0, 100 - (Math.min(distance, radius) / radius) * 35);
  const reputationScore = Math.min(provider.avgRating / 5, 1) * 24 + Math.min(provider.reviewCount, 25);
  const activityScore = Math.min(provider.activityScore, 100) * 0.22;
  const paidBonus = isPaidVisibilityActive(provider) ? 12 : 0;
  const fairness = provider.profileViews < 20 ? 5 : 0;
  return locationScore + reputationScore + activityScore + paidBonus + fairness;
}

export function rankProviders(providers: ProviderProfile[], input: RankingInput) {
  return [...providers].sort((a, b) => {
    const scoreDiff = providerRankingScore(b, input) - providerRankingScore(a, input);
    if (scoreDiff !== 0) return scoreDiff;
    return a.profileViews - b.profileViews;
  });
}
