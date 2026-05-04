import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  recalculateRating,
  type RatingReview,
} from '../../functions/src/reviews.js';
import { readBody, rejectMethod } from '../_lib/http.js';

interface RecalculateBody {
  reviews?: RatingReview[];
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectMethod(req, res, ['POST'])) return;

  const body = readBody<RecalculateBody>(req);
  if (!Array.isArray(body.reviews)) {
    res.status(400).json({ error: 'reviews array is required' });
    return;
  }

  res.status(200).json(recalculateRating(body.reviews));
}
