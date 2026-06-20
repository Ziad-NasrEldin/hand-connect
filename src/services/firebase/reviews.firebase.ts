import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/db';
import { contactConverter, providerConverter, reviewConverter, userConverter } from '@/firebase/converters';
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
  createReview: async (customerId, providerId, rating, comment) => {
    const db = requireFirebaseDb();
    const contacts = await getDocs(
      query(
        collection(db, 'contacts').withConverter(contactConverter),
        where('customerId', '==', customerId),
        where('providerId', '==', providerId),
        where('hasReview', '==', false),
        limit(1),
      ),
    );
    if (contacts.empty) throw new Error('error.review.requiresContact');

    const contact = contacts.docs[0].data();
    const reviewId = `${customerId}_${providerId}`;
    const reviewRef = doc(db, 'reviews', reviewId).withConverter(reviewConverter);
    const contactRef = doc(db, 'contacts', contacts.docs[0].id).withConverter(contactConverter);
    const providerRef = doc(db, 'providers', providerId).withConverter(providerConverter);
    const customerRef = doc(db, 'users', customerId).withConverter(userConverter);

    return runTransaction(db, async (transaction) => {
      const [existingReview, provider, customer] = await Promise.all([
        transaction.get(reviewRef),
        transaction.get(providerRef),
        transaction.get(customerRef),
      ]);
      if (existingReview.exists()) throw new Error('error.review.alreadyExists');
      if (!provider.exists() || provider.data().status !== 'approved') throw new Error('error.provider.notFound');

      const review: Review = {
        id: reviewId,
        providerId,
        customerId,
        customerName: customer.exists() ? customer.data().displayName : 'Customer',
        contactId: contact.id,
        rating,
        comment: comment.trim(),
        status: 'visible',
        createdAt: new Date().toISOString(),
      };
      transaction.set(reviewRef, review);
      transaction.update(contactRef, { hasReview: true });
      return review;
    });
  },
};
