export function approveVisibility(now: Date, days = 30) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
