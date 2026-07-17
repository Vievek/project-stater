import { IRelationAdapter } from '../../infrastructure/relation-adapter';
import { BaseRepository, IDbClient, ICacheService } from '../../base-classes/base.repository';
import { QueryOptions } from '../../utils/query-builder';
import { Category } from './category.types';
import { categoryQueryConfig } from './category.query-config';
import { logger } from '../../utils/logger';

export class CategoryRepository extends BaseRepository<Category> {
  constructor(db: IDbClient<Category>, cacheService: ICacheService, relations?: IRelationAdapter<Category>) {
    super(db, 'category', { needCache: true, ttlSeconds: 60 }, cacheService, categoryQueryConfig, relations);
  }

  // Override findById to enable caching with a custom TTL for this repository
  async findById(id: string): Promise<Category | null> {
    logger.info(`[${this.constructor.name}.findById] Finding by id with custom TTL`, { id });
    return this.cacheManager.withCache('repo:findById', id, async () => {
      return this.relations
        ? this.relations.findUniqueWithRelations(id, ['todos'])
        : this.db.findUnique({ where: { id } });
    }, 30);
  }

  // Custom method for specific sorting
  async findAllLatest(options?: QueryOptions): Promise<Category[]> {
    logger.info(`[${this.constructor.name}.findAllLatest] Finding all latest`, { options });
    return this.cacheManager.withCache(
      'repo:findAllLatest',
      options ? JSON.stringify(options) : undefined,
      async () => {
        if (this.queryBuilder && options) {
          const args = this.queryBuilder.build(options);
          return this.db.findMany(args);
        }
        return this.relations
        ? this.relations.findManyWithRelations(undefined, ['todos'])
        : this.db.findMany();
      }
    );
  }

  // --- AUTO-GENERATED M2M METHODS (sync_m2m_methods.ts) — DO NOT EDIT BELOW THIS LINE ---
  async setTodos(id: string, relatedIds: string[]): Promise<Category> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.setRelation(id, 'todos', relatedIds);
  }

  async connectTodos(id: string, relatedIds: string[]): Promise<Category> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.connectRelation(id, 'todos', relatedIds);
  }

  async disconnectTodos(id: string, relatedIds: string[]): Promise<Category> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.disconnectRelation(id, 'todos', relatedIds);
  }
  // --- END AUTO-GENERATED M2M METHODS ---
}
