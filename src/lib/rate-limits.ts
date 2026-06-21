const dayMs = 24 * 60 * 60 * 1000;

export const dailyRateLimits = {
  whatsappReveals: 20,
  conversationStarts: 20,
  reports: 10,
} as const;

export function isWithinLastDay(isoDate: string, now = Date.now()) {
  const timestamp = Date.parse(isoDate);
  return Number.isFinite(timestamp) && now - timestamp < dayMs;
}

export function assertUnderDailyLimit(count: number, limit: number) {
  if (count >= limit) throw new Error('error.rateLimit.exceeded');
}
