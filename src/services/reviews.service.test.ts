import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReview, canCustomerReviewProvider, getProviderReviews, reportReview } from './reviews.service';
import { readDb, resetDemoDb, writeDb } from './demo/demo-db';
import { nowIso } from '@/lib/dates';
import { dailyRateLimits } from '@/lib/rate-limits';

describe('reviews service', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    resetDemoDb();
  });

  it('allows review only once after contact and updates eligibility', async () => {
    expect(await canCustomerReviewProvider('customer-demo', 'provider-demo')).toBe(false);
    const db = resetDemoDb();
    db.contacts[0].hasReview = false;
    localStorage.setItem('herafy-demo-db', JSON.stringify(db));
    expect(await canCustomerReviewProvider('customer-demo', 'provider-demo')).toBe(true);
    await createReview('customer-demo', 'provider-demo', 5, 'Great work');
    expect(await canCustomerReviewProvider('customer-demo', 'provider-demo')).toBe(false);
  });

  it('creates an open report for a visible review', async () => {
    await reportReview('customer-nour', 'review-1', 'report.reason.reviewContainsPersonalAttack');
    const report = readDb().reports.find((item) => item.targetId === 'review-1' && item.reporterId === 'customer-nour');

    expect(report).toMatchObject({
      targetType: 'review',
      targetId: 'review-1',
      reporterId: 'customer-nour',
      reason: 'report.reason.reviewContainsPersonalAttack',
      status: 'open',
    });
  });

  it('rate limits review submissions per customer', async () => {
    const db = readDb();
    const contact = db.contacts.find((item) => item.customerId === 'customer-demo' && item.providerId === 'provider-demo');
    if (contact) contact.hasReview = false;
    db.reviews = db.reviews.filter((item) => item.customerId !== 'customer-demo');
    for (let index = 0; index < dailyRateLimits.reviewCreates; index += 1) {
      db.reviews.push({
        id: `limit-review-${index}`,
        providerId: `provider-limit-${index}`,
        customerId: 'customer-demo',
        customerName: 'Demo Customer',
        contactId: `contact-limit-${index}`,
        rating: 5,
        comment: 'Limit seed',
        status: 'visible',
        createdAt: nowIso(),
      });
    }
    writeDb(db);

    await expect(createReview('customer-demo', 'provider-demo', 5, 'Great work')).rejects.toThrow('error.rateLimit.exceeded');
  });

  it('returns only visible provider reviews', async () => {
    const db = readDb();
    db.reviews.push({
      id: 'review-hidden',
      providerId: 'provider-demo',
      customerId: 'customer-omar',
      customerName: 'Omar',
      contactId: 'contact-hidden',
      rating: 1,
      comment: 'Hidden review should not render.',
      status: 'removed',
      createdAt: nowIso(),
    });
    writeDb(db);

    const reviews = await getProviderReviews('provider-demo');

    expect(reviews.some((review) => review.id === 'review-hidden')).toBe(false);
    expect(reviews.every((review) => review.status === 'visible')).toBe(true);
  });

  it('rate limits report submissions per reporter', async () => {
    const db = readDb();
    db.reports = db.reports.filter((item) => item.reporterId !== 'customer-nour');
    for (let index = 0; index < dailyRateLimits.reports; index += 1) {
      db.reports.push({
        id: `limit-report-${index}`,
        targetType: 'review',
        targetId: `review-limit-${index}`,
        reporterId: 'customer-nour',
        reason: 'report.reason.reviewContainsPersonalAttack',
        status: 'open',
        createdAt: nowIso(),
      });
    }
    writeDb(db);

    await expect(reportReview('customer-nour', 'review-1', 'report.reason.reviewContainsPersonalAttack')).rejects.toThrow('error.rateLimit.exceeded');
  });
});
