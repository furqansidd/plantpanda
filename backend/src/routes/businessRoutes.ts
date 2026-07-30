import { Router } from 'express';
import {
  listBusinesses,
  updateBusinessStatus,
  setCommissionRate,
  getMyBusiness,
  updateMyBusiness,
  getPlatformConfig,
  updatePlatformConfig,
} from '../controllers/businessController';
import { requireAuth, requireApproved } from '../middleware/auth';
import { requireRole, requireBusinessOwner } from '../middleware/rbac';

const router = Router();

// Superadmin management
router.get('/', requireAuth, requireRole('super_admin'), listBusinesses);
router.patch('/:businessId/status', requireAuth, requireRole('super_admin'), updateBusinessStatus);
router.patch('/:businessId/commission', requireAuth, requireRole('super_admin'), setCommissionRate);
router.get('/platform-config', requireAuth, requireRole('super_admin'), getPlatformConfig);
router.patch('/platform-config', requireAuth, requireRole('super_admin'), updatePlatformConfig);

// Business owner self-service
router.get('/me', requireAuth, requireBusinessOwner, getMyBusiness);
router.patch('/me', requireAuth, requireBusinessOwner, requireApproved, updateMyBusiness);

export default router;
