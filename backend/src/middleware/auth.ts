import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { env } from '../config/env';
import User, { IUser } from '../models/User';
import { ApiError } from '../utils/asyncHandler';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Not authenticated');

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user) throw new ApiError(401, 'User no longer exists');

    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired session'));
  }
}

export function requireApproved(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === 'super_admin') return next();
  if (!req.user?.isApproved) {
    return next(new ApiError(403, 'Your account is pending approval'));
  }
  next();
}
