import { Request, Response } from 'express';
import User from '../models/User';
import Business from '../models/Business';
import { signToken } from '../utils/jwt';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { env } from '../config/env';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setAuthCookie(res: Response, token: string) {
  res.cookie(env.COOKIE_NAME, token, cookieOptions);
}

/** Registers a customer or rider directly. For branch/nursery, also creates the linked Business doc (pending approval). */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password, role, business } = req.body;

  if (!name || !email || !phone || !password || !role) {
    throw new ApiError(400, 'Missing required fields');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({ name, email, phone, password, role });

  if ((role === 'branch' || role === 'nursery') && business) {
    if (!business.name || !business.address || !business.location) {
      throw new ApiError(400, 'Business name, address, and location are required');
    }
    await Business.create({
      userId: user._id,
      name: business.name,
      type: role,
      address: business.address,
      location: { type: 'Point', coordinates: business.location }, // [lng, lat]
      contactPhone: phone,
      status: 'pending',
    });
  }

  const token = signToken({ userId: user._id.toString(), role: user.role });
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: user.isApproved
      ? 'Registration successful'
      : 'Registration successful. Your account is pending approval.',
    user: sanitizeUser(user),
    token, // used by the mobile app, which authenticates via Authorization header instead of cookies
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.role === 'rider' && user.isApproved && user.activeRole !== 'rider') {
    user.activeRole = 'rider';
    await user.save();
  }

  const token = signToken({ userId: user._id.toString(), role: user.role });
  setAuthCookie(res, token);

  res.json({ success: true, user: sanitizeUser(user), token });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie(env.COOKIE_NAME);
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, user: sanitizeUser(req.user!) });
});

function sanitizeUser(user: any) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
}
