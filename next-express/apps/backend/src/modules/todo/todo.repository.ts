import { IRelationAdapter } from '../../infrastructure/relation-adapter';
import { BaseRepository, IDbClient, ICacheService } from '../../base-classes/base.repository';
import { QueryOptions } from '../../utils/query-builder';
import { Todo } from './todo.types';
import { todoQueryConfig } from './todo.query-config';
import { logger } from '../../utils/logger';

export class TodoRepository extends BaseRepository<Todo> {
  constructor(db: IDbClient<Todo>, cacheService: ICacheService, relations?: IRelationAdapter<Todo>) {
    super(db, 'todo', { needCache: true, ttlSeconds: 60 }, cacheService, todoQueryConfig, relations);
  }

  // Override findById to enable caching with a custom TTL for this repository
  async findById(id: string): Promise<Todo | null> {
    logger.info(`[${this.constructor.name}.findById] Finding by id with custom TTL`, { id });
    return this.cacheManager.withCache('repo:findById', id, async () => {
      return this.relations
        ? this.relations.findUniqueWithRelations(id, ['user', 'tags', 'categories'])
        : this.db.findUnique({ where: { id } });
    }, 30);
  }

  // Custom method for specific sorting
  async findAllLatest(options?: QueryOptions): Promise<Todo[]> {
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
        ? this.relations.findManyWithRelations(undefined, ['user', 'tags', 'categories'])
        : this.db.findMany();
      }
    );
  }

  // --- AUTO-GENERATED M2M METHODS (sync_m2m_methods.ts) — DO NOT EDIT BELOW THIS LINE ---
  async setTags(id: string, relatedIds: string[]): Promise<Todo> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.setRelation(id, 'tags', relatedIds);
  }

  async connectTags(id: string, relatedIds: string[]): Promise<Todo> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.connectRelation(id, 'tags', relatedIds);
  }

  async disconnectTags(id: string, relatedIds: string[]): Promise<Todo> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.disconnectRelation(id, 'tags', relatedIds);
  }
  async setCategories(id: string, relatedIds: string[]): Promise<Todo> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.setRelation(id, 'categories', relatedIds);
  }

  async connectCategories(id: string, relatedIds: string[]): Promise<Todo> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.connectRelation(id, 'categories', relatedIds);
  }

  async disconnectCategories(id: string, relatedIds: string[]): Promise<Todo> {
    if (!this.relations) throw new Error('Relation adapter not configured for this repository');
    return this.relations.disconnectRelation(id, 'categories', relatedIds);
  }
  // --- END AUTO-GENERATED M2M METHODS ---
}
