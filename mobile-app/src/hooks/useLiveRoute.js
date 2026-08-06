import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { orderApi } from '../api/endpoints';
import { distanceMeters } from '../utils/geo';

const MIN_MOVE_METERS = 5; // re-fetch route when rider moves at least 5 meters
const MIN_INTERVAL_MS = 3000; // ...or re-fetch every 3 seconds while driving

/**
 * Keeps a road-following route (array of {latitude, longitude}) up to date as
 * `originPos` (the rider's live GPS position) changes.
 * Automatically truncates points behind the rider as they move towards the destination,
 * matching Google Maps turn-by-turn navigation behavior.
 */
export function useLiveRoute(orderId, originPos, phase) {
  const [points, setPoints] = useState([]);
  const [eta, setEta] = useState(null);
  const lastFetchPos = useRef(null);
  const lastFetchTime = useRef(0);
  const prevPhase = useRef(phase);

  const fetchRoute = useCallback(
    async (pos) => {
      if (!orderId || !pos) return;
      try {
        const { data } = await orderApi.getRoute(orderId, pos.longitude, pos.latitude);
        const newPoints = (data.route.points || []).map((p) => ({ latitude: p.lat, longitude: p.lng }));
        setPoints(newPoints);
        setEta({ distanceKm: data.route.distanceKm, durationMin: data.route.durationMin });
        lastFetchPos.current = pos;
        lastFetchTime.current = Date.now();
      } catch (err) {
        console.warn('[useLiveRoute] route fetch failed:', err.message);
      }
    },
    [orderId]
  );

  // Force immediate route re-fetch whenever order phase changes (pickup -> delivery)
  useEffect(() => {
    if (phase !== prevPhase.current) {
      prevPhase.current = phase;
      lastFetchPos.current = null;
      lastFetchTime.current = 0;
      setPoints([]); // Clear old phase points
      if (originPos) {
        fetchRoute(originPos);
      }
    }
  }, [phase, originPos, fetchRoute]);

  // Re-fetch route as rider moves or time elapsed
  useEffect(() => {
    if (!originPos) return;
    const moved = distanceMeters(lastFetchPos.current, originPos);
    const elapsed = Date.now() - lastFetchTime.current;

    if (moved >= MIN_MOVE_METERS || elapsed >= MIN_INTERVAL_MS || !lastFetchPos.current) {
      fetchRoute(originPos);
    }
  }, [originPos, fetchRoute]);

  // Smart Turn-by-Turn Polyline Truncation:
  // Find the index of the point closest to rider's current position.
  // Truncate all points behind the rider so the line shortens as the rider moves forward.
  const livePoints = useMemo(() => {
    if (!points || points.length === 0 || !originPos) return points || [];

    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < points.length; i++) {
      const dist = distanceMeters(originPos, points[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    // If rider is within 15 meters of the final destination point, clear remaining line
    const distToDestination = distanceMeters(originPos, points[points.length - 1]);
    if (distToDestination < 15) {
      return [originPos, points[points.length - 1]];
    }

    // Keep only current rider position + remaining points ahead
    const remainingAhead = points.slice(closestIndex);
    return [originPos, ...remainingAhead];
  }, [points, originPos]);

  return { points: livePoints, eta };
}
