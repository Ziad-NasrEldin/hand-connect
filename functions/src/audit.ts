export function assertAdminReason(reason: string) {
  if (reason.trim().length < 5) throw new Error('Admin reason is required');
}
