import { Server as SocketIOServer } from 'socket.io';
import { redis, RIDERS_GEO_KEY, orderClaimKey, orderRadiusKey } from '../config/redis';
import Order from '../models/Order';
import PlatformConfig from '../models/PlatformConfig';
import Business from '../models/Business';
import { filterOutBlockedRiders } from './ledgerService';
import { ApiError } from '../utils/asyncHandler';

let ioRef: SocketIOServer | null = null;
const escalationTimers = new Map<string, NodeJS.Timeout>();

export function attachSocketServer(io: SocketIOServer) {
  ioRef = io;
}

/**
 * Finds online riders within radiusKm of [lng, lat] using Redis GEOSEARCH,
 * then strips out any rider who is globally blocked due to COD debt on any
 * single business exceeding the threshold.
 */
async function findEligibleRiders(lng: number, lat: number, radiusKm: number): Promise<string[]> {
  // GEOSEARCH riders:online FROMLONLAT lng lat BYRADIUS radiusKm km ASC
  const raw = await redis.geosearch(
    RIDERS_GEO_KEY,
    'FROMLONLAT',
    lng,
    lat,
    'BYRADIUS',
    radiusKm,
    'km',
    'ASC'
  );
  const riderIds = raw as unknown as string[];
  return filterOutBlockedRiders(riderIds);
}

/**
 * Entry point: business marks an order 'ready_for_pickup'. Broadcasts to
 * all eligible online riders within the initial radius and arms the
 * 180-second escalation timer.
 */
export async function startDispatch(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  const config = await PlatformConfig.getSingleton();
  order.dispatchRadiusKm = config.dispatchInitialRadiusKm;
  order.dispatchStartedAt = new Date();
  await order.save();

  await broadcastToRiders(orderId, config.dispatchInitialRadiusKm);
  armEscalationTimer(orderId, config.dispatchEscalationSeconds);
}

async function broadcastToRiders(orderId: string, radiusKm: number) {
  const order = await Order.findById(orderId).populate('businessId', 'name address location');
  if (!order || order.status !== 'ready_for_pickup') return;

  const [lng, lat] = order.pickupLocation.coordinates;
  const eligibleRiderIds = await findEligibleRiders(lng, lat, radiusKm);

  if (eligibleRiderIds.length === 0 || !ioRef) return;

  const payload = {
    orderId: order._id,
    business: order.businessId,
    itemsCount: order.items.length,
    deliveryFee: order.deliveryFee, // rider sees their own earning only
    distanceKm: order.distanceKm,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    radiusKm,
  };

  for (const riderId of eligibleRiderIds) {
    ioRef.to(`rider:${riderId}`).emit('order:available', payload);
  }
}

function armEscalationTimer(orderId: string, seconds: number) {
  clearEscalationTimer(orderId);
  const timer = setTimeout(() => escalate(orderId), seconds * 1000);
  escalationTimers.set(orderId, timer);
}

function clearEscalationTimer(orderId: string) {
  const existing = escalationTimers.get(orderId);
  if (existing) {
    clearTimeout(existing);
    escalationTimers.delete(orderId);
  }
}

async function escalate(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order || order.status !== 'ready_for_pickup') return; // already claimed or cancelled

  const config = await PlatformConfig.getSingleton();
  if (order.dispatchRadiusKm >= config.dispatchExpandedRadiusKm) return; // already at max radius

  order.dispatchRadiusKm = config.dispatchExpandedRadiusKm;
  await order.save();

  await broadcastToRiders(orderId, config.dispatchExpandedRadiusKm);
  if (ioRef) {
    ioRef.to(`business:${order.businessId}`).emit('order:escalated', {
      orderId: order._id,
      newRadiusKm: config.dispatchExpandedRadiusKm,
    });
  }
  // No further escalation beyond the expanded radius in this MVP;
  // business can be alerted to call a rider manually if still unclaimed.
}

/**
 * First-come-first-served claim. Uses a Redis SETNX-style lock so that
 * concurrent 'order:accept' emissions from multiple riders can only ever
 * result in exactly one winner.
 */
export async function claimOrder(orderId: string, riderId: string): Promise<{ success: boolean; reason?: string }> {
  const claimKey = orderClaimKey(orderId);
  // SET key value NX -> succeeds only if no one has claimed yet
  const acquired = await redis.set(claimKey, riderId, 'EX', 3600, 'NX');

  if (!acquired) {
    return { success: false, reason: 'Order already claimed' };
  }

  const order = await Order.findById(orderId);
  if (!order || order.status !== 'ready_for_pickup') {
    await redis.del(claimKey); // release lock, order is stale
    return { success: false, reason: 'Order is no longer available' };
  }

  const [blockedCheck] = await filterOutBlockedRiders([riderId]);
  if (!blockedCheck) {
    await redis.del(claimKey);
    return { success: false, reason: 'You have an outstanding COD balance that must be settled first' };
  }

  order.riderId = riderId as any;
  order.status = 'rider_assigned';
  order.acceptedAt = new Date();
  await order.save();

  clearEscalationTimer(orderId);

  if (ioRef) {
    ioRef.to(`business:${order.businessId}`).emit('order:riderAssigned', { orderId, riderId });
    ioRef.to(`customer:${order.customerId}`).emit('order:riderAssigned', { orderId, riderId });
    ioRef.to(`order:${orderId}`).emit('order:riderAssigned', { orderId, riderId });
  }

  return { success: true };
}

/** Rider location update -> keeps Redis geo index current and streams to interested parties. */
export async function updateRiderLocation(riderId: string, lng: number, lat: number, activeOrderId?: string) {
  await redis.geoadd(RIDERS_GEO_KEY, lng, lat, riderId);

  if (activeOrderId && ioRef) {
    ioRef.to(`order:${activeOrderId}`).emit('rider:locationUpdate', { riderId, lng, lat });
  }
}

export async function setRiderOnline(riderId: string, lng: number, lat: number) {
  await redis.geoadd(RIDERS_GEO_KEY, lng, lat, riderId);
}

export async function setRiderOffline(riderId: string) {
  await redis.zrem(RIDERS_GEO_KEY, riderId);
}
