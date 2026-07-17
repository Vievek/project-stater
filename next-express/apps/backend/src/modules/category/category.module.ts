import { PrismaRelationAdapter } from '../../infrastructure/relation-adapter';
import { Category } from './category.types';
import { AppDeps, AppModule } from '../registry';
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { createCategoryRouter } from './category.routes';

/**
 * Category module factory.
 *
 * Wires the full dependency chain for the category feature and returns a mounted
 * router with its prefix. The factory receives all infrastructure dependencies
 * via injection — it never imports from config/ or infrastructure/ directly.
 */
export function createCategoryModule(deps: AppDeps): AppModule {
  const relations  = new PrismaRelationAdapter<Category>(deps.db.category);
  const repository = new CategoryRepository(deps.db.category, deps.cacheService, relations);
  const service     = new CategoryService(repository, deps.cacheService, deps.transactionManager);
  const controller  = new CategoryController(service);
  const router      = createCategoryRouter(controller);

  return { prefix: '/api/categorys', router };
}
