import { PrismaRelationAdapter } from '../../infrastructure/relation-adapter';
import { Tag } from './tag.types';
import { AppDeps, AppModule } from '../registry';
import { TagRepository } from './tag.repository';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { createTagRouter } from './tag.routes';

/**
 * Tag module factory.
 *
 * Wires the full dependency chain for the tag feature and returns a mounted
 * router with its prefix. The factory receives all infrastructure dependencies
 * via injection — it never imports from config/ or infrastructure/ directly.
 */
export function createTagModule(deps: AppDeps): AppModule {
  const relations  = new PrismaRelationAdapter<Tag>(deps.db.tag);
  const repository = new TagRepository(deps.db.tag, deps.cacheService, relations);
  const service     = new TagService(repository, deps.cacheService, deps.transactionManager);
  const controller  = new TagController(service);
  const router      = createTagRouter(controller);

  return { prefix: '/api/tags', router };
}
