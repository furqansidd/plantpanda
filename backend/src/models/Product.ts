import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  businessId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    category: { type: String, default: 'general' },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', category: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
