import { env } from '../config/env';
import { LngLat } from '../utils/geo';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  points: RoutePoint[];
  distanceKm: number;
  durationMin: number;
}

/**
 * Fetches a real road-following route between two points using OpenRouteService.
 * Used for live tracking maps (rider->nursery and nursery->customer legs) so the
 * polyline follows actual roads instead of a straight line, and can be re-fetched
 * from the rider's current position as they move.
 */
export async function getRoadRoute(origin: LngLat, destination: LngLat): Promise<RouteResult> {
  if (!env.ORS_API_KEY) {
    // Fallback: straight line between the two points if no ORS key is configured.
    return {
      points: [
        { lng: origin[0], lat: origin[1] },
        { lng: destination[0], lat: destination[1] },
      ].map((p) => ({ lat: p.lat, lng: p.lng })),
      distanceKm: 0,
      durationMin: 0,
    };
  }

  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: env.ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [origin, destination], // ORS expects [lng, lat]
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouteService request failed (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  const feature = data.features?.[0];
  const coords: [number, number][] = feature?.geometry?.coordinates || [];
  const summary = feature?.properties?.summary;

  return {
    points: coords.map(([lng, lat]) => ({ lat, lng })),
    distanceKm: summary ? Math.round((summary.distance / 1000) * 100) / 100 : 0,
    durationMin: summary ? Math.round(summary.duration / 60) : 0,
  };
}
