import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readDb, resetDemoDb, writeDb } from './demo/demo-db';
import { searchProviders } from './search.service';

describe('search service', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    resetDemoDb();
  });

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

  it('returns providers that cover a nearby neighborhood by radius', async () => {
    const db = readDb();
    const template = db.providers.find((item) => item.id === 'provider-demo')!;
    db.providers.push({
      ...template,
      id: 'provider-radius-nasr',
      userId: 'provider-radius-nasr',
      displayName: 'Radius Nasr',
      serviceAreas: [{ neighborhood: 'nasr-city', city: 'cairo' }],
      serviceAreaKeys: ['nasr-city'],
      initialServiceAreaKey: 'nasr-city',
      coverageRadiusKm: 20,
      coverageAreaKeys: [],
      avgRating: 4.9,
      reviewCount: 8,
      activityScore: 90,
      visibilityTier: 'organic',
      visibilityPaidUntil: null,
      paidVisibilityStartedAt: null,
    });
    writeDb(db);

    const results = await searchProviders({ profession: 'plumbing', neighborhood: 'heliopolis' });

    expect(results.map((item) => item.id)).toContain('provider-radius-nasr');
  });

  it('excludes paid providers outside requested coverage', async () => {
    const db = readDb();
    const template = db.providers.find((item) => item.id === 'provider-demo')!;
    db.providers.push({
      ...template,
      id: 'provider-paid-shorouk-only',
      userId: 'provider-paid-shorouk-only',
      displayName: 'Paid Shorouk Only',
      serviceAreas: [{ neighborhood: 'shorouk', city: 'cairo' }],
      serviceAreaKeys: ['shorouk'],
      initialServiceAreaKey: 'shorouk',
      coverageRadiusKm: 8,
      coverageAreaKeys: ['shorouk'],
      visibilityTier: 'paid',
      visibilityPaidUntil: '2026-06-01T00:00:00.000Z',
      paidVisibilityStartedAt: '2026-05-04T00:00:00.000Z',
    });
    writeDb(db);

    const results = await searchProviders({ profession: 'plumbing', neighborhood: 'new-cairo' });

    expect(results.map((item) => item.id)).not.toContain('provider-paid-shorouk-only');
  });

  it('excludes approved providers by denormalized owner status', async () => {
    const db = readDb();
    const template = db.providers.find((item) => item.id === 'provider-demo')!;
    db.users.push({
      uid: 'provider-banned-owner',
      email: 'provider-banned-owner@hand.test',
      role: 'provider',
      status: 'banned',
      banReason: 'admin.reason.manualBan',
      bannedAt: '2026-01-02T00:00:00.000Z',
      bannedBy: 'admin',
      displayName: 'Banned Owner',
      phone: '+201001112299',
      language: 'ar',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    db.providers.push({
      ...template,
      id: 'provider-banned-public',
      userId: 'provider-banned-owner',
      displayName: 'Banned Public',
      ownerStatus: 'banned',
      avgRating: 5,
      reviewCount: 99,
      activityScore: 99,
    });
    writeDb(db);

    const results = await searchProviders({ profession: 'plumbing', neighborhood: 'new-cairo' });

    expect(results.map((item) => item.id)).not.toContain('provider-banned-public');
  });

  it('does not hide public search results from stale user status alone', async () => {
    const db = readDb();
    const template = db.providers.find((item) => item.id === 'provider-demo')!;
    db.users.push({
      uid: 'provider-stale-owner',
      email: 'provider-stale-owner@hand.test',
      role: 'provider',
      status: 'banned',
      banReason: 'admin.reason.manualBan',
      bannedAt: '2026-01-02T00:00:00.000Z',
      bannedBy: 'admin',
      displayName: 'Stale Owner',
      phone: '+201001112288',
      language: 'ar',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    db.providers.push({
      ...template,
      id: 'provider-local-active',
      userId: 'provider-stale-owner',
      displayName: 'Local Active',
      ownerStatus: 'active',
      avgRating: 5,
      reviewCount: 99,
      activityScore: 99,
    });
    writeDb(db);

    const results = await searchProviders({ profession: 'plumbing', neighborhood: 'new-cairo' });

    expect(results.map((item) => item.id)).toContain('provider-local-active');
  });
});
