import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRiderEarning extends Document {
  riderId: Types.ObjectId;
  orderId: Types.ObjectId;
  businessId: Types.ObjectId;
  amount: number; // equals order.deliveryFee at time of delivery
  distanceKm: number;
  payoutStatus: 'pending' | 'paid_out';
  createdAt: Date;
}

const RiderEarningSchema = new Schema<IRiderEarning>(
  {
    riderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    amount: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
    payoutStatus: { type: String, enum: ['pending', 'paid_out'], default: 'pending' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IRiderEarning>('RiderEarning', RiderEarningSchema);
