import { env } from '../config/env';

/** [lng, lat] pair, matching GeoJSON Point convention used throughout the models. */
export type LngLat = [number, number];

/**
 * Straight-line (haversine) distance in km between two [lng, lat] points.
 * Used as an always-available fallback and for quick estimates; road
 * distance from Google Distance Matrix is preferred when the API key is set.
 */
export function haversineDistanceKm(a: LngLat, b: LngLat): number {
  const R = 6371; // Earth radius km
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * Resolves the road distance in km between two points using Google's
 * Distance Matrix API when GOOGLE_MAPS_API_KEY is configured, falling
 * back to the haversine straight-line distance otherwise (e.g. local dev).
 */
export async function getDistanceKm(origin: LngLat, destination: LngLat): Promise<number> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    return round2(haversineDistanceKm(origin, destination));
  }

  try {
    const [oLng, oLat] = origin;
    const [dLng, dLat] = destination;
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${oLat},${oLng}&destinations=${dLat},${dLng}` +
      `&key=${env.GOOGLE_MAPS_API_KEY}`;

    const res = await fetch(url);
    const data: any = await res.json();
    const meters = data?.rows?.[0]?.elements?.[0]?.distance?.value;
    if (typeof meters === 'number') {
      return round2(meters / 1000);
    }
  } catch (err) {
    console.error('[geo] Distance Matrix lookup failed, falling back to haversine:', err);
  }

  return round2(haversineDistanceKm(origin, destination));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
