import { describe, expect, it } from 'vitest';
import { requirePublicApprovedProvider } from '../src/provider-visibility.js';

function firestoreWith(provider: unknown, owner: unknown) {
  return {
    collection: (name: string) => ({
      doc: () => ({
        get: async () => {
          if (name === 'providers') return { exists: Boolean(provider), data: () => provider };
          return { exists: Boolean(owner), data: () => owner };
        },
      }),
    }),
  };
}

describe('public provider visibility guard', () => {
  it('rejects approved providers whose owner is banned or missing', async () => {
    await expect(
      requirePublicApprovedProvider(
        firestoreWith({ status: 'approved', userId: 'provider-1' }, { status: 'banned' }) as never,
        'provider-1',
      ),
    ).rejects.toMatchObject({ code: 'not-found' });

    await expect(
      requirePublicApprovedProvider(
        firestoreWith({ status: 'approved', userId: 'provider-1' }, null) as never,
        'provider-1',
      ),
    ).rejects.toMatchObject({ code: 'not-found' });
  });
});
