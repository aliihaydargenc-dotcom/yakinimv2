import type { Coordinates, Place } from '../types';

export function validCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') return false;
  const {lat, lng} = value as Partial<Coordinates>;
  return typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// Precision higher than the old 2-decimal cache key; one block never acquires another's data.
export function geoScope(value: Coordinates | null): string {
  return validCoordinates(value) ? `${value.lat.toFixed(5)}:${value.lng.toFixed(5)}` : 'none';
}

export function nearbyBounds(c: Coordinates) {
  return { south: c.lat - 0.012, north: c.lat + 0.012, west: c.lng - 0.018, east: c.lng + 0.018 };
}

export function metersBetween(a: Coordinates, b: Coordinates): number {
  if (!validCoordinates(a) || !validCoordinates(b)) return Infinity;
  const r = Math.PI / 180;
  const h = Math.sin((b.lat-a.lat)*r/2)**2 +
    Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lng-a.lng)*r/2)**2;
  return Math.round(12742000 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0,1-h))));
}

export function formatDistance(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value) ? 'Mesafe bilinmiyor' :
    value < 1000 ? `${Math.round(value)} m` : `${(value / 1000).toFixed(1).replace('.', ',')} km`;
}

export function filterPlaces(places: Place[], category: string, search: string, origin: Coordinates | null): Place[] {
  const term = search.trim().toLocaleLowerCase('tr-TR');
  return places.filter(place => category === 'all' || place.category === category)
    .filter(place => !term || `${place.name} ${place.address} ${place.category}`.toLocaleLowerCase('tr-TR').includes(term))
    .map(place => ({...place, distanceM: validCoordinates(place) && validCoordinates(origin)
      ? metersBetween(origin, place) : place.distanceM }))
    .sort((a,b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity) || a.name.localeCompare(b.name, 'tr-TR'));
}
