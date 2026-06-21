import { beforeEach, describe, expect, it } from 'vitest';
import { approveVisibilityRequest } from './admin.service';
import { createVisibilityRequest } from './visibility.service';
import { readDb, resetDemoDb, writeDb } from './demo/demo-db';

describe('visibility service', () => {
  beforeEach(() => resetDemoDb());

  it('blocks area expansion before 30 reviews', async () => {
    await expect(
      createVisibilityRequest('provider-demo', 'maadi', 'manual', 'Expand to Maadi'),
    ).rejects.toThrow('error.visibility.areaExpansionRequiresReviews');
  });

  it('allows eligible area expansion and admin approval adds the area', async () => {
    const db = readDb();
    const provider = db.providers.find((item) => item.id === 'provider-demo')!;
    provider.reviewCount = 30;
    writeDb(db);

    const request = await createVisibilityRequest('provider-demo', 'maadi', 'manual', 'Expand to Maadi');
    expect(request.type).toBe('area_expansion');

    await approveVisibilityRequest('admin-demo', request.id, 'admin.reason.paymentConfirmed');

    const updatedProvider = readDb().providers.find((item) => item.id === 'provider-demo')!;
    expect(updatedProvider.serviceAreaKeys).toContain('maadi');
  });
});
