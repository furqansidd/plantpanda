import mongoose, { Schema, Document, Types } from 'mongoose';

export type OrderStatus =
  | 'pending'          // just placed, waiting for business to accept
  | 'accepted'          // business accepted, preparing
  | 'ready_for_pickup'  // business marked ready -> triggers dispatch
  | 'rider_assigned'    // a rider has claimed the order
  | 'picked_up'         // rider verified pickupPIN with business
  | 'delivered'         // rider verified deliveryPIN with customer
  | 'cancelled';

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  customerId: Types.ObjectId;
  businessId: Types.ObjectId;
  riderId?: Types.ObjectId;
  items: IOrderItem[];

  itemsTotal: number;        // sum of item price*qty — this is what the rider owes the business in COD
  distanceKm: number;        // business -> customer drop-off distance
  deliveryFee: number;       // rider's own earning, auto-calculated per-km
  totalAmount: number;       // itemsTotal + deliveryFee — what customer pays in cash
  commissionAmount: number;  // superadmin-only, % of itemsTotal
  commissionRateApplied: number;

  status: OrderStatus;
  paymentMethod: 'cod'; // COD only for now, kept as enum for future extension

  pickupAddress: string;
  pickupLocation: { type: 'Point'; coordinates: [number, number] };
  deliveryAddress: string;
  deliveryLocation: { type: 'Point'; coordinates: [number, number] };

  pickupPIN: string;
  deliveryPIN: string;

  proofOfDeliveryUrl?: string;

  dispatchRadiusKm: number;      // current search radius (starts at 5, escalates to 8)
  dispatchStartedAt?: Date;      // when ready_for_pickup was set, used for the 180s escalation timer
  rejectedRiderIds: Types.ObjectId[]; // riders who let the offer expire / declined, for analytics

  acceptedAt?: Date;
  readyAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    items: { type: [OrderItemSchema], required: true },

    itemsTotal: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    commissionRateApplied: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: { type: String, enum: ['cod'], default: 'cod' },

    pickupAddress: { type: String, required: true },
    pickupLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    deliveryAddress: { type: String, required: true },
    deliveryLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },

    pickupPIN: { type: String, required: true },
    deliveryPIN: { type: String, required: true },

    proofOfDeliveryUrl: { type: String },

    dispatchRadiusKm: { type: Number, default: 5 },
    dispatchStartedAt: { type: Date },
    rejectedRiderIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    acceptedAt: { type: Date },
    readyAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ deliveryLocation: '2dsphere' });
OrderSchema.index({ pickupLocation: '2dsphere' });

// Fields that must NEVER be sent to a business (branch/nursery) portal.
// Enforced centrally here so every controller/serializer references the same list.
export const NURSERY_HIDDEN_FIELDS = ['commissionAmount', 'commissionRateApplied'];

export default mongoose.model<IOrder>('Order', OrderSchema);
