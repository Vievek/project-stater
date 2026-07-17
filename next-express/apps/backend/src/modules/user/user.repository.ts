import { BaseRepository, IDbClient, ICacheService } from '../../base-classes/base.repository';
import { QueryOptions } from '../../utils/query-builder';
import { User } from './user.types';
import { userQueryConfig } from './user.query-config';
import { logger } from '../../utils/logger';

export class UserRepository extends BaseRepository<User> {
  constructor(db: IDbClient<User>, cacheService: ICacheService) {
    super(db, 'user', { needCache: true, ttlSeconds: 60 }, cacheService, userQueryConfig);
  }

  // Override findById to enable caching with a custom TTL for this repository
  async findById(id: string): Promise<User | null> {
    logger.info(`[${this.constructor.name}.findById] Finding by id with custom TTL`, { id });
    return this.cacheManager.withCache('repo:findById', id, async () => {
      return this.db.findUnique({ where: { id }, include: { todos: true } });
    }, 30);
  }

  // Custom method for specific sorting
  async findAllLatest(options?: QueryOptions): Promise<User[]> {
    logger.info(`[${this.constructor.name}.findAllLatest] Finding all latest`, { options });
    return this.cacheManager.withCache(
      'repo:findAllLatest',
      options ? JSON.stringify(options) : undefined,
      async () => {
        if (this.queryBuilder && options) {
          const args = this.queryBuilder.build(options);
          return this.db.findMany(args);
        }
        return this.db.findMany({ include: { todos: true } });
      }
    );
  }
}
