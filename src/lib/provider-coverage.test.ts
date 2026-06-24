import { describe, expect, it } from 'vitest';
import {
  computeCoverageAreaKeys,
  defaultCoverageRadiusKm,
  getPlatformCoverageRadiusKm,
  normalizeCoverageRadiusKm,
  providerCoversNeighborhood,
} from './provider-coverage';
import type { ProviderProfile } from '@/types/provider';

const provider = {
  profession: 'plumbing',
  serviceAreas: [{ neighborhood: 'nasr-city', city: 'cairo' }],
  serviceAreaKeys: ['nasr-city'],
  initialServiceAreaKey: 'nasr-city',
  coverageRadiusKm: defaultCoverageRadiusKm,
  coverageAreaKeys: [],
} as unknown as ProviderProfile;

describe('provider coverage utilities', () => {
  it('normalizes invalid and excessive radius values', () => {
    expect(normalizeCoverageRadiusKm(undefined)).toBe(8);
    expect(normalizeCoverageRadiusKm(Number.NaN)).toBe(8);
    expect(normalizeCoverageRadiusKm(100)).toBe(25);
  });

  it('derives radius from fixed platform policy', () => {
    expect(getPlatformCoverageRadiusKm({
      city: 'cairo',
      profession: 'plumbing',
      serviceAreaKey: 'nasr-city',
    })).toBe(12);
    expect(getPlatformCoverageRadiusKm({
      city: 'cairo',
      profession: 'plumbing',
      serviceAreaKey: 'new-cairo',
    })).toBe(14);
  });

  it('covers exact provider service areas', () => {
    expect(providerCoversNeighborhood(provider, 'nasr-city')).toBe(true);
    expect(computeCoverageAreaKeys(['nasr-city'], defaultCoverageRadiusKm)).toContain('nasr-city');
  });

  it('covers nearby neighborhoods within radius', () => {
    const wideProvider = { ...provider, coverageRadiusKm: 1 };
    expect(providerCoversNeighborhood(wideProvider, 'heliopolis')).toBe(true);
  });

  it('excludes neighborhoods outside radius', () => {
    expect(providerCoversNeighborhood(provider, 'shorouk')).toBe(false);
  });
});
