export interface Neighborhood {
  slug: string;
  nameAr: string;
  nameEn: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const neighborhoods: Neighborhood[] = [
  { slug: 'new-cairo', nameAr: 'القاهرة الجديدة', nameEn: 'New Cairo', coordinates: { lat: 30.0074, lng: 31.4913 } },
  { slug: 'nasr-city', nameAr: 'مدينة نصر', nameEn: 'Nasr City', coordinates: { lat: 30.0561, lng: 31.3300 } },
  { slug: 'maadi', nameAr: 'المعادي', nameEn: 'Maadi', coordinates: { lat: 29.9602, lng: 31.2569 } },
  { slug: 'heliopolis', nameAr: 'مصر الجديدة', nameEn: 'Heliopolis', coordinates: { lat: 30.0910, lng: 31.3220 } },
  { slug: 'zamalek', nameAr: 'الزمالك', nameEn: 'Zamalek', coordinates: { lat: 30.0626, lng: 31.2197 } },
  { slug: 'dokki', nameAr: 'الدقي', nameEn: 'Dokki', coordinates: { lat: 30.0384, lng: 31.2123 } },
  { slug: 'mohandessin', nameAr: 'المهندسين', nameEn: 'Mohandessin', coordinates: { lat: 30.0556, lng: 31.2000 } },
  { slug: 'shorouk', nameAr: 'الشروق', nameEn: 'Shorouk', coordinates: { lat: 30.1419, lng: 31.6236 } },
];

export function getNeighborhoodName(slug: string, language: 'ar' | 'en') {
  const area = neighborhoods.find((item) => item.slug === slug);
  if (!area) return slug;
  return language === 'ar' ? area.nameAr : area.nameEn;
}
