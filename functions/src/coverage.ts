interface Neighborhood {
  slug: string;
  coordinates: { lat: number; lng: number };
}

const neighborhoods: Neighborhood[] = [
  { slug: 'new-cairo', coordinates: { lat: 30.0074, lng: 31.4913 } },
  { slug: 'nasr-city', coordinates: { lat: 30.0561, lng: 31.33 } },
  { slug: 'maadi', coordinates: { lat: 29.9602, lng: 31.2569 } },
  { slug: 'heliopolis', coordinates: { lat: 30.091, lng: 31.322 } },
  { slug: 'zamalek', coordinates: { lat: 30.0626, lng: 31.2197 } },
  { slug: 'dokki', coordinates: { lat: 30.0384, lng: 31.2123 } },
  { slug: 'mohandessin', coordinates: { lat: 30.0556, lng: 31.2 } },
  { slug: 'shorouk', coordinates: { lat: 30.1419, lng: 31.6236 } },
];

const defaultCoverageRadiusKm = 8;
const professionCoverageRadiusKm: Record<string, number> = {
  cleaning: 5,
  electrical: 10,
  painting: 8,
  plumbing: 12,
};
const outerNeighborhoodCoverageRadiusKm: Record<string, number> = {
  'new-cairo': 14,
  shorouk: 14,
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(from: Neighborhood['coordinates'], to: Neighborhood['coordinates']) {
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function getPlatformCoverageRadiusKm(input: { city?: string; profession?: string; serviceAreaKey?: string }) {
  if (input.city && input.city !== 'cairo') return defaultCoverageRadiusKm;
  return (
    outerNeighborhoodCoverageRadiusKm[input.serviceAreaKey ?? ''] ??
    professionCoverageRadiusKm[input.profession ?? ''] ??
    defaultCoverageRadiusKm
  );
}

export function computeCoverageAreaKeys(serviceAreaKeys: string[], radiusKm = defaultCoverageRadiusKm) {
  const centers = serviceAreaKeys
    .map((key) => neighborhoods.find((item) => item.slug === key))
    .filter((item): item is Neighborhood => Boolean(item));
  const covered = new Set(serviceAreaKeys);
  for (const area of neighborhoods) {
    if (centers.some((center) => distanceKm(center.coordinates, area.coordinates) <= radiusKm)) {
      covered.add(area.slug);
    }
  }
  return [...covered].sort();
}
