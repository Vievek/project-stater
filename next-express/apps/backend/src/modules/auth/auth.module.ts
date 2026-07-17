import { PrismaRelationAdapter } from '../../infrastructure/relation-adapter';
import { User } from '../user/user.types';
import { AppDeps, AppModule } from '../registry';
import { UserRepository } from '../user/user.repository';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { createAuthRouter } from './auth.routes';

/**
 * Auth module factory.
 *
 * Mounts the register and login endpoints at /api/auth.
 * Re-uses UserRepository and UserService (same domain object — no duplication).
 * The tokenProvider is received from AppDeps and injected into UserService
 * so all token operations are routed through the shared ITokenProvider.
 */
export function createAuthModule(deps: AppDeps): AppModule {
  const relations  = new PrismaRelationAdapter<User>(deps.db.user);
  const repository = new UserRepository(deps.db.user, deps.cacheService, relations);
  const service    = new UserService(repository, deps.cacheService, deps.transactionManager, deps.tokenProvider);
  const controller = new AuthController(service);
  const router     = createAuthRouter(controller);

  return { prefix: '/api/auth', router };
}
