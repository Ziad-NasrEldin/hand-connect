import type { Review } from '@/types/review';
import type { ReviewsService } from './contracts/reviews.contract';
import { getDataSource } from './data-source';
import * as demo from './demo/reviews.demo';
import { firebaseReviewsService } from './firebase/reviews.firebase';

const demoReviewsService: ReviewsService = demo;

function reviewsService(): ReviewsService {
  return getDataSource() === 'firebase' ? firebaseReviewsService : demoReviewsService;
}

export async function canCustomerReviewProvider(customerId: string, providerId: string) {
  return reviewsService().canCustomerReviewProvider(customerId, providerId);
}

export async function getProviderReviews(providerId: string) {
  return reviewsService().getProviderReviews(providerId);
}

export async function createReview(customerId: string, providerId: string, rating: Review['rating'], comment: string) {
  return reviewsService().createReview(customerId, providerId, rating, comment);
}

export async function reportReview(reporterId: string, reviewId: string, reason: string) {
  return reviewsService().reportReview(reporterId, reviewId, reason);
}

export { recalculateProviderRating } from './demo/reviews.demo';
