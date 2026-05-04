import type { VercelRequest, VercelResponse } from '@vercel/node';
import { approveVisibility } from '../../functions/src/visibility.js';
import { readBody, rejectMethod } from '../_lib/http.js';

interface ApproveVisibilityBody {
  now?: string;
  days?: number;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectMethod(req, res, ['POST'])) return;

  const body = readBody<ApproveVisibilityBody>(req);
  const now = body.now ? new Date(body.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    res
      .status(400)
      .json({ error: 'now must be a valid ISO date when provided' });
    return;
  }

  const days = typeof body.days === 'number' ? body.days : 30;
  res.status(200).json({ paidUntil: approveVisibility(now, days) });
}
