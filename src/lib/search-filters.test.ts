import { describe, expect, it } from 'vitest';
import { normalizeSearchFilters } from './search-filters';

describe('search filter normalization', () => {
  it('falls back from invalid profession and neighborhood params', () => {
    expect(normalizeSearchFilters({ profession: 'bad', neighborhood: 'also-bad' })).toEqual({
      profession: 'plumbing',
      neighborhood: 'new-cairo',
      limit: 20,
    });
  });

  it('uses the first active profession when the default profession is inactive', () => {
    expect(normalizeSearchFilters({ profession: 'plumbing', neighborhood: 'maadi' }, [
      { id: 'plumbing', slug: 'plumbing', nameAr: 'سباك', nameEn: 'Plumber', icon: 'Wrench', active: false, sortOrder: 1 },
      { id: 'cleaning', slug: 'cleaning', nameAr: 'تنظيف', nameEn: 'Cleaning', icon: 'Sparkles', active: true, sortOrder: 2 },
    ])).toEqual({
      profession: 'cleaning',
      neighborhood: 'maadi',
      limit: 20,
    });
  });

  it('clamps invalid and excessive result limits', () => {
    expect(normalizeSearchFilters({ profession: 'plumbing', neighborhood: 'new-cairo', limit: 0 }).limit).toBe(20);
    expect(normalizeSearchFilters({ profession: 'plumbing', neighborhood: 'new-cairo', limit: 500 }).limit).toBe(50);
  });
});
