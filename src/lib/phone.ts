export function normalizeEgyptPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('20')) return digits;
  if (digits.startsWith('0')) return `2${digits}`;
  if (digits.length === 10 && digits.startsWith('1')) return `20${digits}`;
  return digits;
}

export function isValidEgyptPhone(value: string) {
  return /^20(10|11|12|15)\d{8}$/.test(normalizeEgyptPhone(value));
}
