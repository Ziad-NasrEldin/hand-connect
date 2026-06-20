import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

export interface RatingReview {
  rating: number;
  status: 'visible' | 'under_review' | 'removed';
}

interface ReviewRecord extends RatingReview {
  providerId: string;
  customerId: string;
  customerName: string;
  contactId: string;
  comment: string;
  createdAt: string;
}

export function recalculateRating(reviews: RatingReview[]) {
  const visible = reviews.filter((review) => review.status === 'visible');
  if (!visible.length) return { avgRating: 0, reviewCount: 0 };
  return {
    avgRating: Number((visible.reduce((sum, review) => sum + review.rating, 0) / visible.length).toFixed(1)),
    reviewCount: visible.length,
  };
}

function ensureApp() {
  if (!getApps().length) initializeApp();
}

function db() {
  ensureApp();
  return getFirestore();
}

function requireAuth(context: { auth?: { uid: string } }) {
  const uid = context.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in is required.');
  return uid;
}

function readString(value: unknown, field: string, maxLength = 4000) {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `${field} is required.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`);
  }
  return trimmed;
}

function readRating(value: unknown) {
  if (![1, 2, 3, 4, 5].includes(Number(value))) {
    throw new HttpsError('invalid-argument', 'rating is invalid.');
  }
  return Number(value);
}

async function requireAdmin(firestore: Firestore, uid: string) {
  const user = await firestore.collection('users').doc(uid).get();
  if (user.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
}

async function recalculateProviderRating(
  transaction: Transaction,
  firestore: Firestore,
  providerId: string,
) {
  const reviewsSnapshot = await transaction.get(
    firestore.collection('reviews').where('providerId', '==', providerId),
  );
  const rating = recalculateRating(
    reviewsSnapshot.docs.map((review) => review.data() as RatingReview),
  );
  transaction.update(firestore.collection('providers').doc(providerId), rating);
}

export const createReview = onCall(async (request) => {
  const customerId = requireAuth(request);
  const providerId = readString(request.data?.providerId, 'providerId', 120);
  const rating = readRating(request.data?.rating);
  const comment = readString(request.data?.comment, 'comment', 2000);
  const firestore = db();
  const review = await firestore.runTransaction(async (transaction) => {
    const existingReviews = await transaction.get(
      firestore
        .collection('reviews')
        .where('customerId', '==', customerId)
        .where('providerId', '==', providerId)
        .limit(1),
    );
    if (!existingReviews.empty) {
      throw new HttpsError('failed-precondition', 'Review already exists.');
    }

    const contacts = await transaction.get(
      firestore
        .collection('contacts')
        .where('customerId', '==', customerId)
        .where('providerId', '==', providerId)
        .where('hasReview', '==', false)
        .limit(1),
    );
    if (contacts.empty) {
      throw new HttpsError('failed-precondition', 'Review is only available after contact.');
    }

    const providerRef = firestore.collection('providers').doc(providerId);
    const provider = await transaction.get(providerRef);
    if (!provider.exists || provider.data()?.status !== 'approved') {
      throw new HttpsError('not-found', 'Provider is not available.');
    }

    const customer = await transaction.get(firestore.collection('users').doc(customerId));
    const reviewRef = firestore.collection('reviews').doc();
    const timestamp = new Date().toISOString();
    const reviewData: ReviewRecord = {
      providerId,
      customerId,
      customerName: customer.data()?.displayName ?? 'Customer',
      contactId: contacts.docs[0].id,
      rating,
      comment,
      status: 'visible',
      createdAt: timestamp,
    };
    transaction.set(reviewRef, reviewData);
    transaction.update(contacts.docs[0].ref, { hasReview: true });

    const visibleReviews = await transaction.get(
      firestore
        .collection('reviews')
        .where('providerId', '==', providerId)
        .where('status', '==', 'visible'),
    );
    const aggregate = recalculateRating([
      ...visibleReviews.docs.map((item) => item.data() as RatingReview),
      reviewData,
    ]);
    transaction.update(providerRef, aggregate);
    return { id: reviewRef.id, ...reviewData };
  });
  return review;
});

export const hideReview = onCall(async (request) => {
  const adminId = requireAuth(request);
  const reviewId = readString(request.data?.reviewId, 'reviewId', 120);
  const reason = readString(request.data?.reason, 'reason', 1000);
  const reportId = typeof request.data?.reportId === 'string' ? request.data.reportId.trim() : '';
  const firestore = db();
  await requireAdmin(firestore, adminId);

  await firestore.runTransaction(async (transaction) => {
    const reviewRef = firestore.collection('reviews').doc(reviewId);
    const review = await transaction.get(reviewRef);
    if (!review.exists) throw new HttpsError('not-found', 'Review not found.');
    const reviewData = review.data() as ReviewRecord;
    transaction.update(reviewRef, { status: 'removed' });
    if (reportId) transaction.update(firestore.collection('reports').doc(reportId), { status: 'closed' });
    const actionRef = firestore.collection('adminActions').doc();
    transaction.set(actionRef, {
      adminId,
      targetType: 'review',
      targetId: reviewId,
      action: 'hide_review',
      reason,
      createdAt: new Date().toISOString(),
    });
    await recalculateProviderRating(transaction, firestore, reviewData.providerId);
  });
});
