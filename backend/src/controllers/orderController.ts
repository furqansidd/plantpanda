import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Order, { NURSERY_HIDDEN_FIELDS } from '../models/Order';
import Product from '../models/Product';
import Business from '../models/Business';
import { generatePIN } from '../utils/pin';
import { calculateOrderPricing } from '../services/pricingService';
import { startDispatch } from '../services/dispatchService';
import { recordCashCollection, isRiderGloballyBlocked } from '../services/ledgerService';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { getIO } from '../sockets';
import { getRoadRoute } from '../services/routeService';

/** Customer: place a new order. */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { businessId, items, deliveryAddress, deliveryLocation } = req.body;

  if (!businessId || !items?.length || !deliveryAddress || !deliveryLocation) {
    throw new ApiError(400, 'businessId, items, deliveryAddress, and deliveryLocation are required');
  }

  const business = await Business.findById(businessId);
  if (!business || business.status !== 'approved') throw new ApiError(404, 'Business not available');
  if (!business.isOpen) throw new ApiError(400, 'This business is currently closed');

  const productIds = items.map((i: any) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, businessId, isAvailable: true });
  if (products.length !== items.length) throw new ApiError(400, 'One or more items are unavailable');

  let itemsTotal = 0;
  const orderItems = items.map((i: any) => {
    const product = products.find((p) => p._id.toString() === i.productId);
    if (!product) throw new ApiError(400, 'Invalid product in cart');
    if (product.stock < i.quantity) throw new ApiError(400, `Insufficient stock for ${product.name}`);
    itemsTotal += product.price * i.quantity;
    return { productId: product._id, name: product.name, price: product.price, quantity: i.quantity };
  });

  const pricing = await calculateOrderPricing(
    itemsTotal,
    business.location.coordinates as [number, number],
    deliveryLocation,
    business.commissionRate
  );

  const order = await Order.create({
    customerId: req.user!._id,
    businessId,
    items: orderItems,
    itemsTotal: pricing.itemsTotal,
    distanceKm: pricing.distanceKm,
    deliveryFee: pricing.deliveryFee,
    totalAmount: pricing.totalAmount,
    commissionAmount: pricing.commissionAmount,
    commissionRateApplied: pricing.commissionRateApplied,
    status: 'pending',
    pickupAddress: business.address,
    pickupLocation: business.location,
    deliveryAddress,
    deliveryLocation: { type: 'Point', coordinates: deliveryLocation },
    pickupPIN: generatePIN(),
    deliveryPIN: generatePIN(),
  });

  // Decrement stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
  }

  getIO().to(`business:${businessId}`).emit('order:new', { orderId: order._id });

  res.status(201).json({ success: true, order: toCustomerView(order) });
});

/** Business: accept a pending order. */
export const acceptOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await requireOwnedOrder(req);
  if (order.status !== 'pending') throw new ApiError(400, `Cannot accept order in status ${order.status}`);

  order.status = 'accepted';
  order.acceptedAt = new Date();
  await order.save();

  getIO().to(`customer:${order.customerId}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  getIO().to(`business:${order.businessId}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  res.json({ success: true, order: toBusinessView(order) });
});

/** Business: mark ready for pickup -> triggers Redis geofenced dispatch broadcast. */
export const markReadyForPickup = asyncHandler(async (req: Request, res: Response) => {
  const order = await requireOwnedOrder(req);
  if (order.status !== 'accepted') throw new ApiError(400, `Cannot mark ready from status ${order.status}`);

  order.status = 'ready_for_pickup';
  order.readyAt = new Date();
  await order.save();

  await startDispatch(order._id.toString());

  getIO().to(`customer:${order.customerId}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  res.json({ success: true, order: toBusinessView(order) });
});

/** Business: verify the rider's pickupPIN, transition to 'picked_up'. */
export const verifyPickupPIN = asyncHandler(async (req: Request, res: Response) => {
  const order = await requireOwnedOrder(req);
  const { pin } = req.body;

  if (order.status !== 'rider_assigned') throw new ApiError(400, 'Order is not awaiting pickup verification');
  if (order.pickupPIN !== pin) throw new ApiError(400, 'Incorrect pickup PIN');

  order.status = 'picked_up';
  order.pickedUpAt = new Date();
  await order.save();

  const io = getIO();
  io.to(`customer:${order.customerId}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  io.to(`rider:${order.riderId}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  io.to(`business:${order.businessId}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  io.to(`order:${order._id}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  io.to(`order:${order._id}`).emit('order:phaseChange', { orderId: order._id, phase: 'delivery' }); // switches polyline nursery -> customer

  res.json({ success: true, order: toBusinessView(order) });
});

/** Rider: verify the customer's deliveryPIN, transition to 'delivered'. Triggers COD ledger update. */
export const verifyDeliveryPIN = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { pin, proofOfDeliveryUrl } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.riderId || order.riderId.toString() !== req.user!._id.toString()) {
    throw new ApiError(403, 'You are not assigned to this order');
  }
  if (order.status !== 'picked_up') throw new ApiError(400, 'Order is not awaiting delivery verification');
  if (order.deliveryPIN !== pin) throw new ApiError(400, 'Incorrect delivery PIN');

  order.status = 'delivered';
  order.deliveredAt = new Date();
  if (proofOfDeliveryUrl) order.proofOfDeliveryUrl = proofOfDeliveryUrl;
  await order.save();

  // Core COD rule: itemsTotal is added to the rider's debt against this business;
  // deliveryFee is booked separately as the rider's own earning.
  const ledger = await recordCashCollection(order);

  await Business.findById(order.businessId); // (kept for future notification hooks)

  const io = getIO();
  io.to(`customer:${order.customerId}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  io.to(`business:${order.businessId}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  io.to(`rider:${order.riderId}`).emit('ledger:updated', {
    businessId: order.businessId,
    outstandingAmount: ledger.outstandingAmount,
    isBlocked: ledger.isBlocked,
  });
  io.to(`business:${order.businessId}`).emit('ledger:updated', {
    riderId: order.riderId,
    outstandingAmount: ledger.outstandingAmount,
    isBlocked: ledger.isBlocked,
  });

  res.json({
    success: true,
    order: toRiderView(order),
    codStatus: {
      outstandingAmount: ledger.outstandingAmount,
      isBlocked: ledger.isBlocked,
      blockThreshold: ledger.blockThreshold,
    },
  });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = order.customerId.toString() === req.user!._id.toString();
  const isBusiness = req.user!.role === 'branch' || req.user!.role === 'nursery';
  const isAdmin = req.user!.role === 'super_admin';
  if (!isOwner && !isBusiness && !isAdmin) throw new ApiError(403, 'Not authorized to cancel this order');

  if (['picked_up', 'delivered'].includes(order.status)) {
    throw new ApiError(400, 'Order cannot be cancelled at this stage');
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = reason || 'Not specified';
  await order.save();

  // Restock items
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }

  getIO().to(`order:${order._id}`).emit('order:statusUpdate', { orderId: order._id, status: 'cancelled' });
  res.json({ success: true, order });
});

/** Customer: order history. */
export const getMyOrdersAsCustomer = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ customerId: req.user!._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders: orders.map(toCustomerView) });
});

/** Rider: order/ride history (sidebar). */
export const getMyOrdersAsRider = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ riderId: req.user!._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders: orders.map(toRiderView) });
});

/** Business: orders for business accounts, commission fields stripped. */
export const getMyOrdersAsBusiness = asyncHandler(async (req: Request, res: Response) => {
  const { status, businessId } = req.query;
  const filter: any = {};

  if (req.user!.role === 'super_admin') {
    if (businessId) filter.businessId = businessId;
  } else {
    const business = await Business.findOne({ userId: req.user!._id });
    if (!business) throw new ApiError(404, 'Business profile not found');
    filter.businessId = business._id;
  }

  if (status) filter.status = status;

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, orders: orders.map(toBusinessView) });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.orderId).populate('riderId', 'name phone currentLocation');
  if (!order) throw new ApiError(404, 'Order not found');

  const role = req.user!.role;
  let view;
  if (role === 'super_admin') view = order.toObject();
  else if (role === 'branch' || role === 'nursery') view = toBusinessView(order);
  else if (role === 'rider') view = toRiderView(order);
  else view = toCustomerView(order);

  res.json({ success: true, order: view });
});

/**
 * Live road-following route for tracking maps. Called repeatedly (throttled
 * client-side) with the rider's current position as `originLng`/`originLat`.
 * Destination is picked automatically from order status:
 *  - rider_assigned (phase: pickup)  -> nursery/business pickup location
 *  - picked_up       (phase: delivery) -> customer drop-off location
 * The destination marker never moves; only this route line updates.
 */
export const getOrderRoute = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { originLng, originLat } = req.query;

  if (originLng === undefined || originLat === undefined) {
    throw new ApiError(400, 'originLng and originLat are required');
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  const origin: [number, number] = [parseFloat(originLng as string), parseFloat(originLat as string)];
  const destination =
    order.status === 'picked_up'
      ? (order.deliveryLocation.coordinates as [number, number])
      : (order.pickupLocation.coordinates as [number, number]);

  const route = await getRoadRoute(origin, destination);

  res.json({
    success: true,
    phase: order.status === 'picked_up' ? 'delivery' : 'pickup',
    route,
  });
});

// ---- helpers -------------------------------------------------------------

async function requireOwnedOrder(req: Request) {
  if (req.user!.role === 'super_admin') {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  }

  const business = await Business.findOne({ userId: req.user!._id });
  if (!business) throw new ApiError(404, 'Business profile not found');

  const order = await Order.findOne({ _id: req.params.orderId, businessId: business._id });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
}

function toCustomerView(order: any) {
  const obj = order.toObject ? order.toObject() : order;
  delete obj.commissionAmount;
  delete obj.commissionRateApplied;
  return obj;
}

/** Business view NEVER includes commission fields — enforced here centrally. */
function toBusinessView(order: any) {
  const obj = order.toObject ? order.toObject() : order;
  for (const field of NURSERY_HIDDEN_FIELDS) delete obj[field];
  return obj;
}

function toRiderView(order: any) {
  const obj = order.toObject ? order.toObject() : order;
  delete obj.commissionAmount;
  delete obj.commissionRateApplied;
  delete obj.itemsTotal; // rider doesn't need the nursery's product-value breakdown, only their own fee
  return obj;
}
