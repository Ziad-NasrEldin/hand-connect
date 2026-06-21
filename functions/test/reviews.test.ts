import { describe, expect, it } from 'vitest';
import { isActiveAdmin, isActiveUser, recalculateRating } from '../src/reviews.js';

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

describe('review callable account guards', () => {
  it('rejects banned users and banned admins', () => {
    expect(isActiveUser({ status: 'active' })).toBe(true);
    expect(isActiveUser({ status: 'banned' })).toBe(false);
    expect(isActiveAdmin({ role: 'admin', status: 'active' })).toBe(true);
    expect(isActiveAdmin({ role: 'admin', status: 'banned' })).toBe(false);
  });
});
