import type { VercelRequest, VercelResponse } from '@vercel/node';

export function allowMethods(res: VercelResponse, methods: string[]) {
  res.setHeader('Allow', methods);
}

export function rejectMethod(
  req: VercelRequest,
  res: VercelResponse,
  methods: string[],
) {
  if (methods.includes(req.method ?? '')) return false;
  allowMethods(res, methods);
  res
    .status(405)
    .json({ error: `Method ${req.method ?? 'UNKNOWN'} not allowed` });
  return true;
}

export function readBody<T>(req: VercelRequest): T {
  if (typeof req.body === 'string') return JSON.parse(req.body) as T;
  return (req.body ?? {}) as T;
}
