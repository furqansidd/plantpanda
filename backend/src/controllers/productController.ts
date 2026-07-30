import { Request, Response } from 'express';
import Product from '../models/Product';
import Business from '../models/Business';
import { asyncHandler, ApiError } from '../utils/asyncHandler';

async function getOwnedBusinessId(userId: string): Promise<string> {
  const business = await Business.findOne({ userId });
  if (!business) throw new ApiError(404, 'Business profile not found');
  return business._id.toString();
}

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const businessId = await getOwnedBusinessId(req.user!._id.toString());
  const { name, description, price, stock, images, category } = req.body;

  if (!name || price === undefined) throw new ApiError(400, 'Name and price are required');

  const product = await Product.create({
    businessId,
    name,
    description,
    price,
    stock: stock ?? 0,
    images: images ?? [],
    category: category ?? 'general',
  });

  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const businessId = await getOwnedBusinessId(req.user!._id.toString());
  const { productId } = req.params;

  const product = await Product.findOne({ _id: productId, businessId });
  if (!product) throw new ApiError(404, 'Product not found');

  const updatable = ['name', 'description', 'price', 'stock', 'images', 'category', 'isAvailable'];
  for (const field of updatable) {
    if (req.body[field] !== undefined) (product as any)[field] = req.body[field];
  }
  await product.save();

  res.json({ success: true, product });
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const businessId = await getOwnedBusinessId(req.user!._id.toString());
  const { productId } = req.params;

  const product = await Product.findOne({ _id: productId, businessId });
  if (!product) throw new ApiError(404, 'Product not found');

  product.isAvailable = !product.isAvailable;
  await product.save();

  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const businessId = await getOwnedBusinessId(req.user!._id.toString());
  const { productId } = req.params;

  const result = await Product.findOneAndDelete({ _id: productId, businessId });
  if (!result) throw new ApiError(404, 'Product not found');

  res.json({ success: true, message: 'Product deleted' });
});

/** Business owner: list own products. */
export const listMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const businessId = await getOwnedBusinessId(req.user!._id.toString());
  const products = await Product.find({ businessId }).sort({ createdAt: -1 });
  res.json({ success: true, products });
});

/** Public/customer: browse products by business, category, or search query. */
export const browseProducts = asyncHandler(async (req: Request, res: Response) => {
  const { businessId, category, q, lng, lat, radiusKm } = req.query;
  const filter: any = { isAvailable: true };

  if (businessId) filter.businessId = businessId;
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q as string };

  let businessIds: string[] | undefined;
  if (lng && lat) {
    const nearbyBusinesses = await Business.find({
      status: 'approved',
      isOpen: true,
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
          $maxDistance: (parseFloat((radiusKm as string) || '10')) * 1000,
        },
      },
    }).select('_id');
    businessIds = nearbyBusinesses.map((b) => b._id.toString());
    filter.businessId = { $in: businessIds };
  }

  const products = await Product.find(filter).populate('businessId', 'name type address location').limit(100);
  res.json({ success: true, products });
});
