import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/asyncHandler';
import { UserRole } from '../models/User';

/** Usage: router.get('/x', requireAuth, requireRole('super_admin', 'branch'), handler) */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

/** For endpoints usable by both branch and nursery business accounts. */
export const requireBusinessOwner = requireRole('branch', 'nursery');
