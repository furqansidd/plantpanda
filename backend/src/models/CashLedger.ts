import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Tracks how much COD cash a rider is currently holding on behalf of a
 * specific business (branch/nursery). This is intentionally scoped
 * per (rider, business) pair — a rider can freely ride for Business B
 * even while blocked against Business A.
 *
 * outstandingAmount only ever accumulates `itemsTotal` (the product value
 * the rider collected on the business's behalf) — never deliveryFee
 * (rider's own earning) and never commissionAmount (platform's cut,
 * invisible to both rider and business here).
 *
 * isBlocked flips true the instant outstandingAmount >= blockThreshold,
 * and the dispatch layer must exclude this rider from ANY new order
 * broadcast for this businessId until a settlement brings it back down.
 */
export interface ICashLedger extends Document {
  riderId: Types.ObjectId;
  businessId: Types.ObjectId;
  outstandingAmount: number;
  totalCollected: number;
  totalSettled: number;
  blockThreshold: number;
  isBlocked: boolean;
  lastCollectionAt?: Date;
  lastSettlementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CashLedgerSchema = new Schema<ICashLedger>(
  {
    riderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    outstandingAmount: { type: Number, default: 0, min: 0 },
    totalCollected: { type: Number, default: 0 },
    totalSettled: { type: Number, default: 0 },
    blockThreshold: { type: Number, default: 5000 },
    isBlocked: { type: Boolean, default: false },
    lastCollectionAt: { type: Date },
    lastSettlementAt: { type: Date },
  },
  { timestamps: true }
);

CashLedgerSchema.index({ riderId: 1, businessId: 1 }, { unique: true });

export default mongoose.model<ICashLedger>('CashLedger', CashLedgerSchema);
