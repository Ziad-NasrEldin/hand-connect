import { describe, expect, it } from 'vitest';
import { computeCoverageAreaKeys, getPlatformCoverageRadiusKm } from '../src/coverage.js';

describe('server coverage calculation', () => {
  it('matches the deterministic radius behavior used by provider search', () => {
    const radius = getPlatformCoverageRadiusKm({
      city: 'cairo',
      profession: 'plumbing',
      serviceAreaKey: 'nasr-city',
    });

    expect(computeCoverageAreaKeys(['nasr-city', 'maadi'], radius)).toEqual([
      'dokki',
      'heliopolis',
      'maadi',
      'mohandessin',
      'nasr-city',
      'zamalek',
    ]);
  });
});
