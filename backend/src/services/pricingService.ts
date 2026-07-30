import PlatformConfig from '../models/PlatformConfig';
import { LngLat, getDistanceKm } from '../utils/geo';

export interface PricingResult {
  distanceKm: number;
  deliveryFee: number;
  commissionAmount: number;
  commissionRateApplied: number;
  itemsTotal: number;
  totalAmount: number;
}

/**
 * Computes everything money-related for an order at creation time:
 *  - distance from business -> customer drop-off
 *  - deliveryFee: the rider's own earning, auto-calculated purely from
 *    distance * platform per-km rate (+ base fee). The rider never
 *    negotiates this and it is NEVER added to the COD ledger.
 *  - commissionAmount: platform's cut of itemsTotal, superadmin-only,
 *    never exposed to business or rider.
 */
export async function calculateOrderPricing(
  itemsTotal: number,
  businessLocation: LngLat,
  deliveryLocation: LngLat,
  commissionRate: number
): Promise<PricingResult> {
  const config = await PlatformConfig.getSingleton();

  const distanceKm = await getDistanceKm(businessLocation, deliveryLocation);
  const deliveryFee = Math.round(config.baseFee + distanceKm * config.perKmRate);
  const commissionAmount = Math.round((itemsTotal * commissionRate) / 100);
  const totalAmount = itemsTotal + deliveryFee;

  return {
    distanceKm,
    deliveryFee,
    commissionAmount,
    commissionRateApplied: commissionRate,
    itemsTotal,
    totalAmount,
  };
}
