import { describe, expect, it } from 'vitest';
import { distanceKm, findNearestNeighborhood, getNeighborhoodCoordinates } from './location';

describe('location utilities', () => {
  it('returns zero distance for the same coordinates', () => {
    const point = { lat: 30.0074, lng: 31.4913 };
    expect(distanceKm(point, point)).toBeCloseTo(0, 5);
  });

  it('calculates a known Cairo neighborhood distance', () => {
    const newCairo = getNeighborhoodCoordinates('new-cairo')!;
    const nasrCity = getNeighborhoodCoordinates('nasr-city')!;
    expect(distanceKm(newCairo, nasrCity)).toBeGreaterThan(16);
    expect(distanceKm(newCairo, nasrCity)).toBeLessThan(18);
  });

  it('finds the nearest configured neighborhood', () => {
    expect(findNearestNeighborhood({ lat: 30.0069, lng: 31.4905 }).slug).toBe('new-cairo');
  });
});
