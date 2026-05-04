import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertAdminReason } from '../../functions/src/audit.js';
import { readBody, rejectMethod } from '../_lib/http.js';

interface AssertReasonBody {
  reason?: string;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectMethod(req, res, ['POST'])) return;

  const body = readBody<AssertReasonBody>(req);
  if (typeof body.reason !== 'string') {
    res.status(400).json({ error: 'reason is required' });
    return;
  }

  try {
    assertAdminReason(body.reason);
    res.status(200).json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid admin reason';
    res.status(400).json({ error: message });
  }
}
