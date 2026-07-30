import { Types } from 'mongoose';
import CashLedger from '../models/CashLedger';
import CashTransaction from '../models/CashTransaction';
import RiderEarning from '../models/RiderEarning';
import PlatformConfig from '../models/PlatformConfig';
import { IOrder } from '../models/Order';
import { ApiError } from '../utils/asyncHandler';

/**
 * IMPORTANT BUSINESS RULE:
 * If a rider's outstanding COD debt to ANY SINGLE business reaches the
 * global threshold (default Rs 5000), that rider is blocked from
 * accepting ANY order platform-wide — not just orders from that business.
 * They must settle that specific business's balance below the threshold
 * before they can go back online and receive dispatch offers again.
 */

async function getOrCreateLedger(riderId: Types.ObjectId, businessId: Types.ObjectId) {
  const config = await PlatformConfig.getSingleton();
  let ledger = await CashLedger.findOne({ riderId, businessId });
  if (!ledger) {
    ledger = await CashLedger.create({
      riderId,
      businessId,
      blockThreshold: config.codBlockThreshold,
    });
  }
  return ledger;
}

/** Called when an order transitions to 'delivered' (COD). Adds itemsTotal to the rider's debt for that business. */
export async function recordCashCollection(order: IOrder) {
  if (!order.riderId) throw new ApiError(400, 'Order has no assigned rider');

  const ledger = await getOrCreateLedger(order.riderId as Types.ObjectId, order.businessId as Types.ObjectId);
  const config = await PlatformConfig.getSingleton();

  ledger.outstandingAmount += order.itemsTotal;
  ledger.totalCollected += order.itemsTotal;
  ledger.blockThreshold = config.codBlockThreshold; // keep in sync with latest global setting
  ledger.isBlocked = ledger.outstandingAmount >= ledger.blockThreshold;
  ledger.lastCollectionAt = new Date();
  await ledger.save();

  await CashTransaction.create({
    ledgerId: ledger._id,
    riderId: order.riderId,
    businessId: order.businessId,
    orderId: order._id,
    type: 'collection',
    amount: order.itemsTotal,
    balanceAfter: ledger.outstandingAmount,
  });

  // Rider's own earning (delivery fee) — entirely separate from the COD ledger.
  await RiderEarning.create({
    riderId: order.riderId,
    orderId: order._id,
    businessId: order.businessId,
    amount: order.deliveryFee,
    distanceKm: order.distanceKm,
  });

  return ledger;
}

/** Business/branch staff records a cash settlement received from a rider. */
export async function recordSettlement(
  ledgerId: string,
  amountReceived: number,
  recordedBy: Types.ObjectId
) {
  if (amountReceived <= 0) throw new ApiError(400, 'Settlement amount must be greater than zero');

  const ledger = await CashLedger.findById(ledgerId);
  if (!ledger) throw new ApiError(404, 'Cash ledger not found');

  if (amountReceived > ledger.outstandingAmount) {
    throw new ApiError(400, `Amount exceeds outstanding balance of Rs ${ledger.outstandingAmount}`);
  }

  ledger.outstandingAmount -= amountReceived;
  ledger.totalSettled += amountReceived;
  ledger.isBlocked = ledger.outstandingAmount >= ledger.blockThreshold;
  ledger.lastSettlementAt = new Date();
  await ledger.save();

  await CashTransaction.create({
    ledgerId: ledger._id,
    riderId: ledger.riderId,
    businessId: ledger.businessId,
    type: 'settlement',
    amount: amountReceived,
    recordedBy,
    balanceAfter: ledger.outstandingAmount,
  });

  return ledger;
}

/**
 * GLOBAL eligibility check used by the dispatch layer before broadcasting
 * or accepting ANY order for this rider, regardless of which business the
 * order belongs to. Returns true if the rider has at least one blocked
 * ledger anywhere on the platform.
 */
export async function isRiderGloballyBlocked(riderId: Types.ObjectId | string): Promise<boolean> {
  const blockedLedger = await CashLedger.findOne({ riderId, isBlocked: true });
  return !!blockedLedger;
}

/** Bulk version for filtering a list of candidate rider IDs during dispatch broadcast. */
export async function filterOutBlockedRiders(riderIds: string[]): Promise<string[]> {
  if (riderIds.length === 0) return [];
  const blocked = await CashLedger.find({ riderId: { $in: riderIds }, isBlocked: true }).distinct('riderId');
  const blockedSet = new Set(blocked.map((id) => id.toString()));
  return riderIds.filter((id) => !blockedSet.has(id));
}

export async function getRiderLedgers(riderId: Types.ObjectId | string) {
  return CashLedger.find({ riderId }).populate('businessId', 'name type address');
}

export async function getBusinessLedgers(businessId: Types.ObjectId | string) {
  return CashLedger.find({ businessId }).populate('riderId', 'name phone profileImage rating');
}

export async function getLedgerTransactions(ledgerId: string) {
  return CashTransaction.find({ ledgerId }).sort({ createdAt: -1 });
}
