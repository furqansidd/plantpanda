import { Request, Response } from 'express';
import Business from '../models/Business';
import CashLedger from '../models/CashLedger';
import { getBusinessLedgers, getLedgerTransactions, recordSettlement } from '../services/ledgerService';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { getIO } from '../sockets';

/** Business/branch/nursery: list all riders who owe cash, with outstanding/settled totals. */
export const getBusinessLedgerList = asyncHandler(async (req: Request, res: Response) => {
  const business = await Business.findOne({ userId: req.user!._id });
  if (!business) throw new ApiError(404, 'Business profile not found');

  const ledgers = await getBusinessLedgers(business._id.toString());
  res.json({ success: true, ledgers });
});

export const getBusinessLedgerTransactions = asyncHandler(async (req: Request, res: Response) => {
  const business = await Business.findOne({ userId: req.user!._id });
  if (!business) throw new ApiError(404, 'Business profile not found');

  const ledger = await CashLedger.findOne({ _id: req.params.ledgerId, businessId: business._id });
  if (!ledger) throw new ApiError(404, 'Ledger not found for this business');

  const transactions = await getLedgerTransactions(ledger._id.toString());
  res.json({ success: true, transactions });
});

/**
 * Business staff records a cash payment received from a rider, e.g.
 * "500 received, 500 left" — the response's outstandingAmount is exactly
 * what the rider will also see on their own dashboard for symmetry.
 */
export const settleRiderPayment = asyncHandler(async (req: Request, res: Response) => {
  const business = await Business.findOne({ userId: req.user!._id });
  if (!business) throw new ApiError(404, 'Business profile not found');

  const { ledgerId } = req.params;
  const { amountReceived } = req.body;

  const ledger = await CashLedger.findOne({ _id: ledgerId, businessId: business._id });
  if (!ledger) throw new ApiError(404, 'Ledger not found for this business');

  const updated = await recordSettlement(ledgerId, amountReceived, req.user!._id as any);

  getIO().to(`rider:${updated.riderId}`).emit('ledger:updated', {
    businessId: business._id,
    outstandingAmount: updated.outstandingAmount,
    isBlocked: updated.isBlocked,
  });

  res.json({
    success: true,
    message: `Rs ${amountReceived} recorded. Rs ${updated.outstandingAmount} remaining.`,
    ledger: updated,
  });
});
