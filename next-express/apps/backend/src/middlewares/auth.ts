import { Request, Response, NextFunction } from 'express';
import { ITokenProvider } from '../infrastructure/token-provider';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * authMiddleware factory — returns a middleware that verifies a Bearer JWT.
 *
 * Using a factory (instead of a module-level singleton) keeps the middleware
 * testable without module-level singletons and follows the same closure-based
 * pattern as rbacMiddleware.
 *
 * Usage in routes:
 *   import { createAuthMiddleware } from '../../middlewares/auth';
 *   finalRouter.delete('/', createAuthMiddleware(tokenProvider), controller.deleteAll);
 */
export function createAuthMiddleware(tokenProvider: ITokenProvider) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Missing or malformed Authorization header', 401));
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      const payload = tokenProvider.verify(token);
      req.user = payload;
      logger.info('[authMiddleware] Token verified', { sub: payload.sub, role: payload.role });
      next();
    } catch (err) {
      next(err);
    }
  };
}
