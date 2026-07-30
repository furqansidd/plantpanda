import { Request, Response } from 'express';
import Order from '../models/Order';
import Business from '../models/Business';
import User from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

/** Superadmin: platform-wide overview cards. */
export const getGlobalDashboard = asyncHandler(async (req: Request, res: Response) => {
  const [totalRevenue, orderCount, activeNurseries, activeBranches, activeRiders, pendingApprovals] =
    await Promise.all([
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, commission: { $sum: '$commissionAmount' } } },
      ]),
      Order.countDocuments(),
      Business.countDocuments({ type: 'nursery', status: 'approved' }),
      Business.countDocuments({ type: 'branch', status: 'approved' }),
      User.countDocuments({ role: 'rider', isApproved: true }),
      Business.countDocuments({ status: 'pending' }) as any,
    ]);

  res.json({
    success: true,
    dashboard: {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalCommissionEarned: totalRevenue[0]?.commission || 0,
      orderCount,
      activeNurseries,
      activeBranches,
      activeRiders,
      pendingApprovals,
    },
  });
});

/** Superadmin ONLY: commission earned per business — never exposed to business or rider views. */
export const getCommissionSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await Order.aggregate([
    { $match: { status: 'delivered' } },
    {
      $group: {
        _id: '$businessId',
        totalCommission: { $sum: '$commissionAmount' },
        totalItemsValue: { $sum: '$itemsTotal' },
        totalDeliveryFees: { $sum: '$deliveryFee' },
        totalOrders: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'businesses',
        localField: '_id',
        foreignField: '_id',
        as: 'business',
      },
    },
    { $unwind: '$business' },
    {
      $project: {
        businessId: '$_id',
        businessName: '$business.name',
        businessType: '$business.type',
        commissionRate: '$business.commissionRate',
        totalCommission: 1,
        totalItemsValue: 1,
        totalDeliveryFees: 1,
        totalOrders: 1,
      },
    },
    { $sort: { totalCommission: -1 } },
  ]);

  const grandTotalCommission = summary.reduce((sum, s) => sum + s.totalCommission, 0);

  res.json({ success: true, summary, grandTotalCommission });
});

/** Superadmin: branch-specific vs nursery-specific vs overall performance breakdown. */
export const getPerformanceAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const byType = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $lookup: { from: 'businesses', localField: 'businessId', foreignField: '_id', as: 'business' } },
    { $unwind: '$business' },
    {
      $group: {
        _id: '$business.type',
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' },
      },
    },
  ]);

  const dailyTrend = await Order.aggregate([
    { $match: { status: 'delivered' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  res.json({ success: true, byType, dailyTrend });
});

/** Superadmin: pending riders awaiting approval. */
export const getPendingRiders = asyncHandler(async (req: Request, res: Response) => {
  const riders = await User.find({ role: 'rider', isApproved: false });
  res.json({ success: true, riders });
});

export const approveRider = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { approve } = req.body; // boolean
  const rider = await User.findOneAndUpdate(
    { _id: userId, role: 'rider' },
    { isApproved: !!approve },
    { new: true }
  );
  res.json({ success: true, rider });
});
