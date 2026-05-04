import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isPotentialLeadSpam } from '../../functions/src/abuse.js';
import { readBody, rejectMethod } from '../_lib/http.js';

interface AbuseCheckBody {
  revealsInHour?: number;
  messagesInHour?: number;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectMethod(req, res, ['POST'])) return;

  const body = readBody<AbuseCheckBody>(req);
  if (
    typeof body.revealsInHour !== 'number' ||
    typeof body.messagesInHour !== 'number'
  ) {
    res
      .status(400)
      .json({ error: 'revealsInHour and messagesInHour are required numbers' });
    return;
  }

  res.status(200).json({
    isPotentialLeadSpam: isPotentialLeadSpam(
      body.revealsInHour,
      body.messagesInHour,
    ),
  });
}
