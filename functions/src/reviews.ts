export interface RatingReview {
  rating: number;
  status: 'visible' | 'under_review' | 'removed';
}

export function recalculateRating(reviews: RatingReview[]) {
  const visible = reviews.filter((review) => review.status === 'visible');
  if (!visible.length) return { avgRating: 0, reviewCount: 0 };
  return {
    avgRating: Number((visible.reduce((sum, review) => sum + review.rating, 0) / visible.length).toFixed(1)),
    reviewCount: visible.length,
  };
}
