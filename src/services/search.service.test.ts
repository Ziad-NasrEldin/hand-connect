import { beforeEach, describe, expect, it } from 'vitest';
import { readDb, resetDemoDb, writeDb } from './demo/demo-db';
import { searchProviders } from './search.service';

describe('search service', () => {
  beforeEach(() => resetDemoDb());

  it('recovers invalid search filters to default results', async () => {
    const defaultResults = await searchProviders({ profession: 'plumbing', neighborhood: 'new-cairo' });
    const invalidResults = await searchProviders({ profession: 'invalid-profession', neighborhood: 'invalid-area' });

    expect(invalidResults.map((item) => item.id)).toEqual(defaultResults.map((item) => item.id));
    expect(invalidResults.length).toBeGreaterThan(0);
  });

  it('limits ranked results to the requested bounded size', async () => {
    const db = readDb();
    const template = db.providers.find((item) => item.id === 'provider-demo')!;
    for (let index = 0; index < 8; index += 1) {
      db.providers.push({
        ...template,
        id: `provider-search-limit-${index}`,
        userId: `provider-search-limit-${index}`,
        displayName: `Search Limit ${index}`,
        avgRating: 4 + index / 10,
        reviewCount: index,
      });
    }
    writeDb(db);

    const results = await searchProviders({ profession: 'plumbing', neighborhood: 'new-cairo', limit: 3 });

    expect(results).toHaveLength(3);
  });
});
