import { ApiResponse } from '../../utils/ApiResponse';
import { UserService } from '../user/user.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';

/**
 * AuthController — handles POST /api/auth/register and POST /api/auth/login.
 *
 * Intentionally a standalone class (not extending BaseController) because
 * auth responses have a different shape: { user: SafeUser; token: string }.
 */
export class AuthController {
  constructor(private readonly service: UserService) {}

  register = asyncHandler(async (req, res) => {
    logger.info('[AuthController.register] Registering new user');
    const result = await this.service.register(req.body);
    res.status(201).json(ApiResponse.success(result, 'Registered successfully'));
  });

  login = asyncHandler(async (req, res) => {
    logger.info('[AuthController.login] User login attempt');
    const { email, password } = req.body;
    const result = await this.service.login(email, password);
    res.json(ApiResponse.success(result, 'Login successful'));
  });
}
