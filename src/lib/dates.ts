export function nowIso() {
  return new Date().toISOString();
}

export function formatDate(value: string, language: 'ar' | 'en' = 'ar') {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
}
