import { Router } from 'express';
import authRoutes from './authRoutes';
import businessRoutes from './businessRoutes';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import riderRoutes from './riderRoutes';
import ledgerRoutes from './ledgerRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/businesses', businessRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/riders', riderRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (req, res) => res.json({ success: true, message: 'PlantPanda API is running' }));

export default router;
