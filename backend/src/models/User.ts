import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'super_admin' | 'branch' | 'nursery' | 'customer' | 'rider';
export type ActiveRole = 'customer' | 'rider';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  isApproved: boolean;
  activeRole: ActiveRole;
  isOnline: boolean;
  currentLocation: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  profileImage?: string;
  // Rider-specific
  vehicleType?: 'bike' | 'scooter' | 'car' | 'bicycle';
  vehicleNumber?: string;
  rating?: number;
  totalDeliveries: number;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'branch', 'nursery', 'customer', 'rider'],
      required: true,
      default: 'customer',
    },
    isApproved: { type: Boolean, default: true }, // customers/super_admin auto-approved; branch/nursery/rider require approval
    activeRole: { type: String, enum: ['customer', 'rider'], default: 'customer' },
    isOnline: { type: Boolean, default: false },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    profileImage: { type: String },
    vehicleType: { type: String, enum: ['bike', 'scooter', 'car', 'bicycle'] },
    vehicleNumber: { type: String },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ currentLocation: '2dsphere' });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Riders and branch/nursery accounts default to pending approval
UserSchema.pre('validate', function (next) {
  if ((this.role === 'branch' || this.role === 'nursery' || this.role === 'rider') && this.isNew) {
    this.isApproved = false;
  }
  next();
});

export default mongoose.model<IUser>('User', UserSchema);
