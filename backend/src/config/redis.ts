import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('[redis] connected'));
redis.on('error', (err) => console.error('[redis] error:', err.message));

// Geo-index key for all currently online riders (regardless of business).
// GEOADD riders:online <lng> <lat> <riderId>
export const RIDERS_GEO_KEY = 'riders:online';

// Per-order dispatch bookkeeping keys
export const orderClaimKey = (orderId: string) => `order:${orderId}:claimed_by`;
export const orderRadiusKey = (orderId: string) => `order:${orderId}:radius`;
export const orderNotifiedKey = (orderId: string) => `order:${orderId}:notified_riders`;

// Rider metadata cache (isOnline flag, activeRole) - kept alongside geo set
export const riderMetaKey = (riderId: string) => `rider:${riderId}:meta`;
