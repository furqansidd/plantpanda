import { Router } from 'express';
import {
  getGlobalDashboard,
  getCommissionSummary,
  getPerformanceAnalytics,
  getPendingRiders,
  approveRider,
} from '../controllers/adminController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(requireAuth, requireRole('super_admin'));

router.get('/dashboard', getGlobalDashboard);
router.get('/commission-summary', getCommissionSummary); // superadmin-only, never exposed elsewhere
router.get('/analytics', getPerformanceAnalytics);
router.get('/riders/pending', getPendingRiders);
router.patch('/riders/:userId/approve', approveRider);

export default router;
