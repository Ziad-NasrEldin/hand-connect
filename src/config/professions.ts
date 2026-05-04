import type { Profession } from '@/types/provider';

export const professions: Profession[] = [
  { id: 'plumbing', slug: 'plumbing', nameAr: 'سباك', nameEn: 'Plumber', icon: 'Wrench', active: true, sortOrder: 1 },
  { id: 'electrical', slug: 'electrical', nameAr: 'كهربائي', nameEn: 'Electrician', icon: 'Zap', active: true, sortOrder: 2 },
  { id: 'carpentry', slug: 'carpentry', nameAr: 'نجار', nameEn: 'Carpenter', icon: 'Hammer', active: true, sortOrder: 3 },
  { id: 'cleaning', slug: 'cleaning', nameAr: 'تنظيف', nameEn: 'Cleaning', icon: 'Sparkles', active: true, sortOrder: 4 },
];

export function getProfessionName(slug: string, language: 'ar' | 'en') {
  const profession = professions.find((item) => item.slug === slug);
  if (!profession) return slug;
  return language === 'ar' ? profession.nameAr : profession.nameEn;
}
