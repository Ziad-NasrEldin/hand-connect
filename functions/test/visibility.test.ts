import { describe, expect, it } from 'vitest';
import { approveVisibility } from '../src/visibility';

describe('approveVisibility', () => {
  it('returns a paid-until date thirty days out by default', () => {
    expect(approveVisibility(new Date('2026-05-04T00:00:00.000Z'))).toBe('2026-06-03T00:00:00.000Z');
  });
});
