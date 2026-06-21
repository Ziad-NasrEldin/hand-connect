import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/db';
import { callFirebaseFunction } from '@/firebase/functions';
import { contactConverter, reviewConverter } from '@/firebase/converters';
import type { Review } from '@/types/review';
import type { ReviewsService } from '../contracts/reviews.contract';

function requireFirebaseDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error('error.firebase.notConfigured');
  return db;
}

export const firebaseReviewsService: ReviewsService = {
  canCustomerReviewProvider: async (customerId, providerId) => {
    const db = requireFirebaseDb();
    const [contacts, existingReviews] = await Promise.all([
      getDocs(
        query(
          collection(db, 'contacts').withConverter(contactConverter),
          where('customerId', '==', customerId),
          where('providerId', '==', providerId),
          where('hasReview', '==', false),
          limit(1),
        ),
      ),
      getDocs(
        query(
          collection(db, 'reviews').withConverter(reviewConverter),
          where('customerId', '==', customerId),
          where('providerId', '==', providerId),
          limit(1),
        ),
      ),
    ]);
    return !contacts.empty && existingReviews.empty;
  },
  getProviderReviews: async (providerId) => {
    const db = requireFirebaseDb();
    const snapshot = await getDocs(
      query(
        collection(db, 'reviews').withConverter(reviewConverter),
        where('providerId', '==', providerId),
        where('status', '==', 'visible'),
        orderBy('createdAt', 'desc'),
      ),
    );
    return snapshot.docs.map((item) => item.data());
  },
  createReview: async (_customerId, providerId, rating, comment) =>
    callFirebaseFunction<
      { providerId: string; rating: number; comment: string },
      Review
    >('createReview', {
      providerId,
      rating,
      comment,
    }),
  reportReview: async (reporterId, reviewId, reason) => {
    await callFirebaseFunction<{ reviewId: string; reason: string }, void>('reportReview', { reviewId, reason });
  },
};
