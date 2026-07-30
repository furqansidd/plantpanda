import { Router } from 'express';
import {
  getBusinessLedgerList,
  getBusinessLedgerTransactions,
  settleRiderPayment,
} from '../controllers/ledgerController';
import { requireAuth, requireApproved } from '../middleware/auth';
import { requireBusinessOwner } from '../middleware/rbac';

const router = Router();

router.get('/', requireAuth, requireBusinessOwner, getBusinessLedgerList);
router.get('/:ledgerId/transactions', requireAuth, requireBusinessOwner, getBusinessLedgerTransactions);
router.post('/:ledgerId/settle', requireAuth, requireBusinessOwner, requireApproved, settleRiderPayment);

export default router;
