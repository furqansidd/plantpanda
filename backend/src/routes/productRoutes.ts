import { Router } from 'express';
import {
  createProduct,
  updateProduct,
  toggleAvailability,
  deleteProduct,
  listMyProducts,
  browseProducts,
} from '../controllers/productController';
import { requireAuth, requireApproved } from '../middleware/auth';
import { requireBusinessOwner } from '../middleware/rbac';

const router = Router();

// Public / customer browsing
router.get('/browse', browseProducts);

// Business owner inventory management
router.get('/mine', requireAuth, requireBusinessOwner, listMyProducts);
router.post('/', requireAuth, requireBusinessOwner, requireApproved, createProduct);
router.patch('/:productId', requireAuth, requireBusinessOwner, requireApproved, updateProduct);
router.patch('/:productId/toggle', requireAuth, requireBusinessOwner, requireApproved, toggleAvailability);
router.delete('/:productId', requireAuth, requireBusinessOwner, requireApproved, deleteProduct);

export default router;
