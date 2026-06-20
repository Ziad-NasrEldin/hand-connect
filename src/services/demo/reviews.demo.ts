import { createId, readDb, writeDb } from './demo-db';
import type { Review } from '@/types/review';
import { nowIso } from '@/lib/dates';

export async function canCustomerReviewProvider(customerId: string, providerId: string) {
  const contact = readDb().contacts.find((item) => item.customerId === customerId && item.providerId === providerId && !item.hasReview);
  return Boolean(contact);
}

export async function getProviderReviews(providerId: string) {
  return readDb()
    .reviews.filter((item) => item.providerId === providerId && item.status === 'visible')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReview(customerId: string, providerId: string, rating: Review['rating'], comment: string) {
  const db = readDb();
  const contact = db.contacts.find((item) => item.customerId === customerId && item.providerId === providerId && !item.hasReview);
  if (!contact) throw new Error('Review is only available after contact');
  const customer = db.users.find((item) => item.uid === customerId);
  const review: Review = {
    id: createId('review'),
    providerId,
    customerId,
    customerName: customer?.displayName ?? 'Customer',
    contactId: contact.id,
    rating,
    comment,
    status: 'visible',
    createdAt: nowIso(),
  };
  db.reviews.push(review);
  contact.hasReview = true;
  recalculateProviderRating(db, providerId);
  writeDb(db);
  return review;
}

export function recalculateProviderRating(db: ReturnType<typeof readDb>, providerId: string) {
  const provider = db.providers.find((item) => item.id === providerId);
  if (!provider) return;
  const visibleReviews = db.reviews.filter((item) => item.providerId === providerId && item.status === 'visible');
  provider.reviewCount = visibleReviews.length;
  provider.avgRating = visibleReviews.length
    ? Number((visibleReviews.reduce((sum, item) => sum + item.rating, 0) / visibleReviews.length).toFixed(1))
    : 0;
}
