export function normalizeFirebaseError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع';
}
