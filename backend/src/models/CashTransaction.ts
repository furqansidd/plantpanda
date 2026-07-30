import mongoose, { Schema, Document, Types } from 'mongoose';

export type CashTransactionType = 'collection' | 'settlement';

export interface ICashTransaction extends Document {
  ledgerId: Types.ObjectId;
  riderId: Types.ObjectId;
  businessId: Types.ObjectId;
  orderId?: Types.ObjectId; // present for 'collection', absent for 'settlement'
  type: CashTransactionType;
  amount: number;
  recordedBy?: Types.ObjectId; // business staff user who entered a settlement
  balanceAfter: number; // outstandingAmount snapshot right after this entry
  note?: string;
  createdAt: Date;
}

const CashTransactionSchema = new Schema<ICashTransaction>(
  {
    ledgerId: { type: Schema.Types.ObjectId, ref: 'CashLedger', required: true, index: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    type: { type: String, enum: ['collection', 'settlement'], required: true },
    amount: { type: Number, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    balanceAfter: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<ICashTransaction>('CashTransaction', CashTransactionSchema);
