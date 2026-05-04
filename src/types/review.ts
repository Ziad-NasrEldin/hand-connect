export type ReviewStatus = 'visible' | 'under_review' | 'removed';

export interface Review {
  id: string;
  providerId: string;
  customerId: string;
  customerName: string;
  contactId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}
