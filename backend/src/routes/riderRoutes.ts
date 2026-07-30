import { Router } from 'express';
import {
  switchActiveRole,
  goOnline,
  goOffline,
  pingLocation,
  acceptOrder,
  getMyEarnings,
  getMyLedgers,
  getMyLedgerTransactions,
} from '../controllers/riderController';
import { requireAuth, requireApproved } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.patch('/active-role', requireAuth, switchActiveRole);
router.post('/online', requireAuth, requireRole('rider'), requireApproved, goOnline);
router.post('/offline', requireAuth, requireRole('rider'), goOffline);
router.post('/location', requireAuth, requireRole('rider'), pingLocation);
router.post('/orders/:orderId/accept', requireAuth, requireRole('rider'), requireApproved, acceptOrder);
router.get('/earnings', requireAuth, requireRole('rider'), getMyEarnings);
router.get('/ledgers', requireAuth, requireRole('rider'), getMyLedgers);
router.get('/ledgers/:ledgerId/transactions', requireAuth, requireRole('rider'), getMyLedgerTransactions);

export default router;
