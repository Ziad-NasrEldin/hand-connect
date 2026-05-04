import { describe, expect, it } from 'vitest';
import { recalculateRating } from '../src/reviews';

describe('recalculateRating', () => {
  it('excludes removed reviews from provider reputation', () => {
    expect(
      recalculateRating([
        { rating: 5, status: 'visible' },
        { rating: 1, status: 'removed' },
        { rating: 4, status: 'visible' },
      ]),
    ).toEqual({ avgRating: 4.5, reviewCount: 2 });
  });
});
