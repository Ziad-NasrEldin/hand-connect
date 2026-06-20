import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rejectMethod } from './_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectMethod(req, res, ['GET'])) return;

  res.status(200).json({
    ok: true,
    service: 'herafy-backend',
    provider: 'vercel',
    environment: process.env.VERCEL_ENV ?? 'local',
    region: process.env.VERCEL_REGION ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
}
