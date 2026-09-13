import { Request, Response, NextFunction } from 'express';
import { queryOne } from '../db/database.js';
import { User, UserRole } from '../../shared/types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check authorization header or cookie or X-User-Id header for fast demo switching
  const userId = req.headers['x-user-id'] as string || req.cookies?.user_id;

  if (userId) {
    const user = queryOne<User>('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
    if (user) {
      req.user = user;
    }
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Role ${req.user.role} does not have permission to access this resource. Required: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
}

export function isCostPriceAllowed(role?: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}
