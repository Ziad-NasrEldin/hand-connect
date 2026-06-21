import { beforeEach, describe, expect, it } from 'vitest';
import { getProviderMetrics } from './analytics.service';
import { resetDemoDb } from './demo/demo-db';

describe('analytics service', () => {
  beforeEach(() => resetDemoDb());

  it('returns provider contact, response, and review metrics', async () => {
    const metrics = await getProviderMetrics('provider-demo');

    expect(metrics.contactsCount).toBeGreaterThan(0);
    expect(metrics.conversationsCount).toBe(1);
    expect(metrics.responseRate).toBe(100);
    expect(metrics.averageFirstResponseMinutes).toBe(0);
    expect(metrics.latestReviews[0]?.id).toBe('review-1');
  });
});
