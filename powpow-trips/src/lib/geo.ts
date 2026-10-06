import type { PlaceCategory } from './types';

export type SearchResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
};

type NominatimItem = {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
};

function guessCategory(cls?: string, type?: string): PlaceCategory {
  if (cls === 'tourism' && (type === 'hotel' || type === 'hostel' || type === 'guest_house' || type === 'motel')) {
    return 'stay';
  }
  if (cls === 'amenity' && ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court'].includes(type ?? '')) {
    return 'food';
  }
  if (cls === 'shop') return 'shopping';
  if (cls === 'aeroway' || cls === 'railway' || type === 'bus_station') return 'transport';
  if (cls === 'tourism' || cls === 'historic' || cls === 'leisure' || cls === 'natural') return 'sight';
  return 'other';
}

/**
 * Free-text place search using OpenStreetMap Nominatim (no API key needed).
 * Usage policy: max ~1 request/second, so callers should debounce.
 */
export async function searchPlaces(query: string, near?: string): Promise<SearchResult[]> {
  const q = near && !query.toLowerCase().includes(near.toLowerCase()) ? `${query}, ${near}` : query;
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=15&addressdetails=0&q=' +
    encodeURIComponent(q);
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'PowPowTrips/1.0 (travel planner app)' },
  });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const items = (await res.json()) as NominatimItem[];
  return items.map((it) => ({
    id: String(it.place_id),
    name: it.name || it.display_name.split(',')[0],
    address: it.display_name,
    latitude: Number(it.lat),
    longitude: Number(it.lon),
    category: guessCategory(it.class, it.type),
  }));
}

export function mapsUrl(p: { name: string; latitude?: number; longitude?: number; address?: string }): string {
  if (p.latitude != null && p.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || p.name)}`;
}

export function directionsUrl(points: { latitude?: number; longitude?: number }[]): string | null {
  const pts = points.filter((p) => p.latitude != null && p.longitude != null);
  if (pts.length < 2) return null;
  const fmt = (p: (typeof pts)[number]) => `${p.latitude},${p.longitude}`;
  const origin = fmt(pts[0]);
  const destination = fmt(pts[pts.length - 1]);
  const waypoints = pts.slice(1, -1).map(fmt).join('|');
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '')
  );
}

/** Straight-line distance in km. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
