import { describe, expect, it } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';
import { professionPayload } from '../src/admin.js';

describe('admin callable validation', () => {
  it('accepts complete profession payloads', () => {
    expect(professionPayload({
      id: 'painting',
      slug: 'painting',
      nameAr: 'دهان',
      nameEn: 'Painting',
      icon: 'Brush',
      active: true,
      sortOrder: 1,
    })).toMatchObject({ id: 'painting', active: true, sortOrder: 1 });
  });

  it('rejects incomplete profession payloads', () => {
    expect(() => professionPayload({ id: 'painting' })).toThrow(HttpsError);
  });
});
