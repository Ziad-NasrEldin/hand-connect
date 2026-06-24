import { neighborhoods } from '@/config/neighborhoods';

export interface Coordinates {
  lat: number;
  lng: number;
}

const earthRadiusKm = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceKm(from: Coordinates, to: Coordinates) {
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function getNeighborhoodCoordinates(slug: string) {
  const neighborhood = neighborhoods.find((item) => item.slug === slug);
  return neighborhood?.coordinates ?? null;
}

export function findNearestNeighborhood(coords: Coordinates) {
  return neighborhoods
    .map((neighborhood) => ({
      slug: neighborhood.slug,
      distanceKm: distanceKm(coords, neighborhood.coordinates),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
}
