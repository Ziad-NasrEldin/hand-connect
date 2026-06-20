import type { Review } from '@/types/review';

export interface ReviewsService {
  canCustomerReviewProvider(customerId: string, providerId: string): Promise<boolean>;
  getProviderReviews(providerId: string): Promise<Review[]>;
  createReview(customerId: string, providerId: string, rating: Review['rating'], comment: string): Promise<Review>;
}
