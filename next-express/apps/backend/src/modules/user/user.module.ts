import { AppDeps, AppModule } from '../registry';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { createUserRouter } from './user.routes';

/**
 * User module factory.
 *
 * Wires the full dependency chain for the user feature and returns a mounted
 * router with its prefix. The factory receives all infrastructure dependencies
 * via injection — it never imports from config/ or infrastructure/ directly.
 */
export function createUserModule(deps: AppDeps): AppModule {
  const repository  = new UserRepository(deps.db.user, deps.cacheService);
  const service     = new UserService(repository, deps.cacheService, deps.transactionManager);
  const controller  = new UserController(service);
  const router      = createUserRouter(controller);

  return { prefix: '/api/users', router };
}
