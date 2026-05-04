export interface Neighborhood {
  slug: string;
  nameAr: string;
  nameEn: string;
}

export const neighborhoods: Neighborhood[] = [
  { slug: 'new-cairo', nameAr: 'القاهرة الجديدة', nameEn: 'New Cairo' },
  { slug: 'nasr-city', nameAr: 'مدينة نصر', nameEn: 'Nasr City' },
  { slug: 'maadi', nameAr: 'المعادي', nameEn: 'Maadi' },
  { slug: 'heliopolis', nameAr: 'مصر الجديدة', nameEn: 'Heliopolis' },
  { slug: 'zamalek', nameAr: 'الزمالك', nameEn: 'Zamalek' },
  { slug: 'dokki', nameAr: 'الدقي', nameEn: 'Dokki' },
  { slug: 'mohandessin', nameAr: 'المهندسين', nameEn: 'Mohandessin' },
  { slug: 'shorouk', nameAr: 'الشروق', nameEn: 'Shorouk' },
];

export function getNeighborhoodName(slug: string, language: 'ar' | 'en') {
  const area = neighborhoods.find((item) => item.slug === slug);
  if (!area) return slug;
  return language === 'ar' ? area.nameAr : area.nameEn;
}
