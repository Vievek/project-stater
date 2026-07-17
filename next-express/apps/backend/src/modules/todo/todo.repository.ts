import { BaseRepository, IDbClient, ICacheService } from '../../base-classes/base.repository';
import { QueryOptions } from '../../utils/query-builder';
import { Todo } from './todo.types';
import { todoQueryConfig } from './todo.query-config';
import { logger } from '../../utils/logger';

export class TodoRepository extends BaseRepository<Todo> {
  constructor(db: IDbClient<Todo>, cacheService: ICacheService) {
    super(db, 'todo', { needCache: true, ttlSeconds: 60 }, cacheService, todoQueryConfig);
  }

  // Override findById to enable caching with a custom TTL for this repository
  async findById(id: string): Promise<Todo | null> {
    logger.info(`[${this.constructor.name}.findById] Finding by id with custom TTL`, { id });
    return this.cacheManager.withCache('repo:findById', id, async () => {
      return this.db.findUnique({ where: { id }, include: { user: true } });
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
        return this.db.findMany({ include: { user: true } });
      }
    );
  }
}
