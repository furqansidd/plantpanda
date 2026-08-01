import { Router } from 'express';
import {
  createOrder,
  acceptOrder,
  markReadyForPickup,
  verifyPickupPIN,
  verifyDeliveryPIN,
  cancelOrder,
  getMyOrdersAsCustomer,
  getMyOrdersAsRider,
  getMyOrdersAsBusiness,
  getOrderById,
  getOrderRoute,
} from '../controllers/orderController';
import { requireAuth, requireApproved } from '../middleware/auth';
import { requireRole, requireBusinessOwner } from '../middleware/rbac';

const router = Router();

// Customer
router.post('/', requireAuth, requireRole('customer'), createOrder);
router.get('/mine/customer', requireAuth, getMyOrdersAsCustomer);

// Business (branch/nursery)
router.get('/mine/business', requireAuth, requireBusinessOwner, getMyOrdersAsBusiness);
router.patch('/:orderId/accept', requireAuth, requireBusinessOwner, requireApproved, acceptOrder);
router.patch('/:orderId/ready', requireAuth, requireBusinessOwner, requireApproved, markReadyForPickup);
router.post('/:orderId/verify-pickup-pin', requireAuth, requireBusinessOwner, requireApproved, verifyPickupPIN);

// Rider
router.get('/mine/rider', requireAuth, requireRole('rider'), getMyOrdersAsRider);
router.post('/:orderId/verify-delivery-pin', requireAuth, requireRole('rider'), verifyDeliveryPIN);

// Shared
router.get('/:orderId/route', requireAuth, getOrderRoute);
router.get('/:orderId', requireAuth, getOrderById);
router.patch('/:orderId/cancel', requireAuth, cancelOrder);

export default router;
