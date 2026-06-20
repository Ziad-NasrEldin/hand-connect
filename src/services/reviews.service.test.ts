import { beforeEach, describe, expect, it } from 'vitest';
import { createReview, canCustomerReviewProvider } from './reviews.service';
import { resetDemoDb } from './demo/demo-db';

describe('reviews service', () => {
  beforeEach(() => resetDemoDb());

  it('allows review only once after contact and updates eligibility', async () => {
    expect(await canCustomerReviewProvider('customer-demo', 'provider-demo')).toBe(false);
    const db = resetDemoDb();
    db.contacts[0].hasReview = false;
    localStorage.setItem('herafy-demo-db', JSON.stringify(db));
    expect(await canCustomerReviewProvider('customer-demo', 'provider-demo')).toBe(true);
    await createReview('customer-demo', 'provider-demo', 5, 'Great work');
    expect(await canCustomerReviewProvider('customer-demo', 'provider-demo')).toBe(false);
  });
});
