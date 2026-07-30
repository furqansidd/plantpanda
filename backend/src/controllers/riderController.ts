import { Request, Response } from 'express';
import User from '../models/User';
import RiderEarning from '../models/RiderEarning';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { claimOrder, updateRiderLocation, setRiderOnline, setRiderOffline } from '../services/dispatchService';
import { isRiderGloballyBlocked, getRiderLedgers, getLedgerTransactions } from '../services/ledgerService';

/** Toggle between 'customer' and 'rider' mode in the shared app. */
export const switchActiveRole = asyncHandler(async (req: Request, res: Response) => {
  const { activeRole } = req.body;
  if (!['customer', 'rider'].includes(activeRole)) throw new ApiError(400, 'Invalid role');

  if (activeRole === 'rider' && req.user!.role !== 'rider') {
    throw new ApiError(403, 'You are not registered as a rider');
  }
  if (activeRole === 'rider' && !req.user!.isApproved) {
    throw new ApiError(403, 'Your rider account is still pending approval');
  }

  req.user!.activeRole = activeRole;
  await req.user!.save();
  res.json({ success: true, activeRole });
});

/** Rider goes online — checked against global COD block before allowing dispatch eligibility. */
export const goOnline = asyncHandler(async (req: Request, res: Response) => {
  const { lng, lat } = req.body;
  if (lng === undefined || lat === undefined) throw new ApiError(400, 'lng and lat are required');

  const blocked = await isRiderGloballyBlocked(req.user!._id.toString());
  if (blocked) {
    throw new ApiError(
      403,
      'You have an outstanding cash balance with a business that has reached the limit. Please settle it before going online.'
    );
  }

  await setRiderOnline(req.user!._id.toString(), lng, lat);
  req.user!.isOnline = true;
  req.user!.currentLocation = { type: 'Point', coordinates: [lng, lat] };
  await req.user!.save();

  res.json({ success: true, isOnline: true });
});

export const goOffline = asyncHandler(async (req: Request, res: Response) => {
  await setRiderOffline(req.user!._id.toString());
  req.user!.isOnline = false;
  await req.user!.save();
  res.json({ success: true, isOnline: false });
});

/** High-frequency location ping while online / during an active delivery. */
export const pingLocation = asyncHandler(async (req: Request, res: Response) => {
  const { lng, lat, activeOrderId } = req.body;
  if (lng === undefined || lat === undefined) throw new ApiError(400, 'lng and lat are required');

  await updateRiderLocation(req.user!._id.toString(), lng, lat, activeOrderId);
  req.user!.currentLocation = { type: 'Point', coordinates: [lng, lat] };
  await req.user!.save();

  res.json({ success: true });
});

/** Rider taps "Accept" on the dispatch modal — first-come-first-served via Redis lock. */
export const acceptOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const result = await claimOrder(orderId, req.user!._id.toString());

  if (!result.success) {
    return res.status(409).json({ success: false, message: result.reason });
  }
  res.json({ success: true, message: 'Order assigned to you' });
});

/** Rider's own earnings (delivery fees only — never COD product value). */
export const getMyEarnings = asyncHandler(async (req: Request, res: Response) => {
  const earnings = await RiderEarning.find({ riderId: req.user!._id }).sort({ createdAt: -1 });
  const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
  const pending = earnings.filter((e) => e.payoutStatus === 'pending').reduce((sum, e) => sum + e.amount, 0);

  res.json({ success: true, totalEarned, pendingPayout: pending, earnings });
});

/** Rider's COD ledger across all businesses — "you owe X, Y is blocked" view. */
export const getMyLedgers = asyncHandler(async (req: Request, res: Response) => {
  const ledgers = await getRiderLedgers(req.user!._id.toString());
  const globallyBlocked = ledgers.some((l) => l.isBlocked);
  res.json({ success: true, ledgers, globallyBlocked });
});

export const getMyLedgerTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { ledgerId } = req.params;
  const transactions = await getLedgerTransactions(ledgerId);
  res.json({ success: true, transactions });
});
