import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * rbacMiddleware — Role-Based Access Control factory middleware.
 *
 * Checks that `req.user` (populated by authMiddleware) has one of the
 * `allowedRoles`. The middleware should be placed AFTER authMiddleware in
 * the route handler chain.
 *
 * Decision table:
 * ┌──────────────┬──────────────────┬──────────────────────────┐
 * │ req.user     │ allowedRoles     │ outcome                  │
 * ├──────────────┼──────────────────┼──────────────────────────┤
 * │ undefined    │ any              │ AppError 401 (no user)   │
 * │ { role: X }  │ does not incl. X │ AppError 403 (forbidden) │
 * │ { role: X }  │ includes X       │ next()                   │
 * └──────────────┴──────────────────┴──────────────────────────┘
 *
 * Usage:
 *   finalRouter.delete('/', createAuthMiddleware(tp), rbacMiddleware('ADMIN'), controller.deleteAll);
 */
export function rbacMiddleware(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized — authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('[rbacMiddleware] Access denied', {
        userRole: req.user.role,
        allowedRoles,
      });
      return next(new AppError('Forbidden — insufficient role', 403));
    }

    next();
  };
}
