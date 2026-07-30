import mongoose, { Schema, Document } from 'mongoose';

/**
 * Singleton document holding global platform settings.
 * Only one document should ever exist — use PlatformConfig.getSingleton().
 */
export interface IPlatformConfig extends Document {
  perKmRate: number;      // Rs per km, drives rider deliveryFee calculation
  baseFee: number;        // flat fee added to every delivery
  codBlockThreshold: number; // GLOBAL — rider blocked from a business once outstanding >= this
  defaultCommissionRate: number; // default % applied to new businesses
  dispatchInitialRadiusKm: number;
  dispatchExpandedRadiusKm: number;
  dispatchEscalationSeconds: number;
  updatedAt: Date;
}

const PlatformConfigSchema = new Schema<IPlatformConfig>(
  {
    perKmRate: { type: Number, default: 20 },
    baseFee: { type: Number, default: 20 },
    codBlockThreshold: { type: Number, default: 5000 },
    defaultCommissionRate: { type: Number, default: 10 },
    dispatchInitialRadiusKm: { type: Number, default: 5 },
    dispatchExpandedRadiusKm: { type: Number, default: 8 },
    dispatchEscalationSeconds: { type: Number, default: 180 },
  },
  { timestamps: true }
);

PlatformConfigSchema.statics.getSingleton = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

interface PlatformConfigModel extends mongoose.Model<IPlatformConfig> {
  getSingleton(): Promise<IPlatformConfig>;
}

export default mongoose.model<IPlatformConfig, PlatformConfigModel>('PlatformConfig', PlatformConfigSchema);
