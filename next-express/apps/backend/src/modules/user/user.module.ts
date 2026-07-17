import { PrismaRelationAdapter } from '../../infrastructure/relation-adapter';
import { User } from './user.types';
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
  const relations  = new PrismaRelationAdapter<User>(deps.db.user);
  const repository = new UserRepository(deps.db.user, deps.cacheService, relations);
  const service    = new UserService(repository, deps.cacheService, deps.transactionManager, deps.tokenProvider);
  const controller = new UserController(service);
  const router     = createUserRouter(controller);

  return { prefix: '/api/users', router };
}
