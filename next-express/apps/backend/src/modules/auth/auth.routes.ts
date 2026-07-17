import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { registerSchema, loginSchema } from '../user/user.schemas.extended';

/**
 * Creates and returns the Auth router.
 *
 * Routes:
 *   POST /api/auth/register  — create a new user account + return JWT
 *   POST /api/auth/login     — verify credentials + return JWT
 *
 * These routes are intentionally NOT protected by authMiddleware — they are
 * the entry points for obtaining a token.
 */
export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/register', validate(registerSchema), controller.register);
  router.post('/login',    validate(loginSchema),    controller.login);

  return router;
}
