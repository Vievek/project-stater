/**
 * Express Request type augmentation.
 *
 * Adds `req.user` (populated by authMiddleware) so the full TypeScript
 * type graph knows the user is available on authenticated routes.
 */
import { TokenPayload } from '../../infrastructure/token-provider';

declare global {
  namespace Express {
    interface Request {
      /** Populated by authMiddleware after a valid JWT is verified. */
      user?: TokenPayload;
    }
  }
}
