import mongoose, { Schema, Document, Types } from 'mongoose';

export type BusinessType = 'branch' | 'nursery';
export type BusinessStatus = 'pending' | 'approved' | 'rejected';

export interface IBusiness extends Document {
  userId: Types.ObjectId;
  name: string;
  type: BusinessType;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  commissionRate: number; // percentage, e.g. 10 = 10% of itemsTotal — SUPERADMIN VISIBLE ONLY
  codBlockThreshold: number; // global default but stored per-business for future flexibility
  status: BusinessStatus;
  logoUrl?: string;
  contactPhone?: string;
  isOpen: boolean; // manual open/close toggle for accepting new orders
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['branch', 'nursery'], required: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    commissionRate: { type: Number, default: 10, min: 0, max: 100 },
    codBlockThreshold: { type: Number, default: 5000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    logoUrl: { type: String },
    contactPhone: { type: String },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BusinessSchema.index({ location: '2dsphere' });

export default mongoose.model<IBusiness>('Business', BusinessSchema);
