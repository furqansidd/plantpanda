import { useEffect, useRef, useState, useCallback } from 'react';
import { orderApi } from '../api/endpoints';
import { distanceMeters } from '../utils/geo';

const MIN_MOVE_METERS = 80; // re-fetch route only after the rider moves at least this far
const MIN_INTERVAL_MS = 15000; // ...or at least this much time has passed, whichever comes first

/**
 * Keeps a road-following route (array of {latitude, longitude}) up to date as
 * `originPos` (the rider's live GPS position) changes. Destination is decided
 * server-side from the order's current status/phase, so it never has to be
 * passed in here and never moves on screen.
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
        setPoints(data.route.points.map((p) => ({ latitude: p.lat, longitude: p.lng })));
        setEta({ distanceKm: data.route.distanceKm, durationMin: data.route.durationMin });
        lastFetchPos.current = pos;
        lastFetchTime.current = Date.now();
      } catch (err) {
        // Keep showing the last known route rather than clearing it on a transient network error.
        console.warn('[useLiveRoute] route fetch failed:', err.message);
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (phase !== prevPhase.current) {
      prevPhase.current = phase;
      lastFetchPos.current = null;
    }
  }, [phase]);

  useEffect(() => {
    if (!originPos) return;
    const moved = distanceMeters(lastFetchPos.current, originPos);
    const elapsed = Date.now() - lastFetchTime.current;

    if (moved >= MIN_MOVE_METERS || elapsed >= MIN_INTERVAL_MS || !lastFetchPos.current) {
      fetchRoute(originPos);
    }
  }, [originPos, fetchRoute]);

  return { points, eta };
}
