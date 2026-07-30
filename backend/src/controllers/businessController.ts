import { Request, Response } from 'express';
import Business from '../models/Business';
import User from '../models/User';
import PlatformConfig from '../models/PlatformConfig';
import { asyncHandler, ApiError } from '../utils/asyncHandler';

/** Superadmin: list businesses, optionally filtered by status/type. */
export const listBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const { status, type } = req.query;
  const filter: any = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  const businesses = await Business.find(filter).populate('userId', 'name email phone isApproved');
  res.json({ success: true, businesses });
});

/** Superadmin: approve or reject a pending branch/nursery. */
export const updateBusinessStatus = asyncHandler(async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Status must be approved or rejected');
  }

  const business = await Business.findById(businessId);
  if (!business) throw new ApiError(404, 'Business not found');

  business.status = status;
  await business.save();

  await User.findByIdAndUpdate(business.userId, { isApproved: status === 'approved' });

  res.json({ success: true, business });
});

/** Superadmin: set commission rate for a specific business. */
export const setCommissionRate = asyncHandler(async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { commissionRate } = req.body;

  if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
    throw new ApiError(400, 'commissionRate must be a number between 0 and 100');
  }

  const business = await Business.findByIdAndUpdate(businessId, { commissionRate }, { new: true });
  if (!business) throw new ApiError(404, 'Business not found');

  res.json({ success: true, business });
});

/** Business owner: view/update own profile (name, address, isOpen). Commission rate NEVER editable here. */
export const getMyBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await Business.findOne({ userId: req.user!._id });
  if (!business) throw new ApiError(404, 'Business profile not found');

  // Strip commission fields before returning to the business owner themselves.
  const obj = business.toObject();
  delete (obj as any).commissionRate;
  res.json({ success: true, business: obj });
});

export const updateMyBusiness = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, location, contactPhone, isOpen, logoUrl } = req.body;
  const business = await Business.findOne({ userId: req.user!._id });
  if (!business) throw new ApiError(404, 'Business profile not found');

  if (name) business.name = name;
  if (address) business.address = address;
  if (location) business.location = { type: 'Point', coordinates: location };
  if (contactPhone) business.contactPhone = contactPhone;
  if (typeof isOpen === 'boolean') business.isOpen = isOpen;
  if (logoUrl) business.logoUrl = logoUrl;

  await business.save();
  res.json({ success: true, business });
});

/** Superadmin: platform-wide config (per-km rate, COD threshold, dispatch tuning). */
export const getPlatformConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = await PlatformConfig.getSingleton();
  res.json({ success: true, config });
});

export const updatePlatformConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = await PlatformConfig.getSingleton();
  const allowedFields = [
    'perKmRate',
    'baseFee',
    'codBlockThreshold',
    'defaultCommissionRate',
    'dispatchInitialRadiusKm',
    'dispatchExpandedRadiusKm',
    'dispatchEscalationSeconds',
  ] as const;

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      (config as any)[field] = req.body[field];
    }
  }
  await config.save();
  res.json({ success: true, config });
});
