import { AppError } from '../utils/AppError';
import { PaginationOptions } from '../shared/schemas';
import { CacheManager, ICacheService, CacheOptions } from '../utils/cache-manager';
import { QueryBuilder, QueryFieldConfig, QueryOptions } from '../utils/query-builder';
import { logger } from '../utils/logger';

export { ICacheService, CacheOptions };

export interface IDbClient<T> {
  findMany(args?: any): Promise<T[]>;
  findUnique(args: any): Promise<T | null>;
  create(args: any): Promise<T>;
  update(args: any): Promise<T>;
  delete(args: any): Promise<T>;
  deleteMany?(args?: any): Promise<any>;
}

export interface IRepository<T> {
  findAll(options?: QueryOptions): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: unknown): Promise<T>;
  update(id: string, data: unknown): Promise<T>;
  updateOrThrow(id: string, data: unknown, notFoundMessage?: string): Promise<T>;
  delete(id: string): Promise<void>;
  deleteOrThrow(id: string, notFoundMessage?: string): Promise<void>;
  deleteAll(): Promise<void>;
}

export abstract class BaseRepository<T> implements IRepository<T> {
  protected db: IDbClient<T>;
  protected cacheManager: CacheManager;
  protected queryBuilder?: QueryBuilder;

  constructor(
    dbClient: IDbClient<T>,
    modelName: string,
    cacheOpts?: Partial<CacheOptions>,
    cacheService?: ICacheService,
    queryConfig?: QueryFieldConfig
  ) {
    this.db = dbClient;
    this.cacheManager = new CacheManager(modelName, cacheOpts, cacheService);
    if (queryConfig) this.queryBuilder = new QueryBuilder(queryConfig);
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    logger.info(`[${this.constructor.name}.findAll] Finding all records`, { options });
    return this.cacheManager.withCache('repo:findAll', JSON.stringify(options || {}), async () => {
      if (this.queryBuilder && options) {
        const args = this.queryBuilder.build(options);
        return this.db.findMany(args);
      }
      
      // Fallback for simple pagination if no query builder configured
      if (options?.pagination) {
        const skip = (options.pagination.page - 1) * options.pagination.pageSize;
        return this.db.findMany({ skip, take: options.pagination.pageSize } as any);
      }
      return this.db.findMany();
    });
  }

  async findById(id: string): Promise<T | null> {
    logger.info(`[${this.constructor.name}.findById] Finding record by id`, { id });
    return this.db.findUnique({ where: { id } });
  }

  async create(data: unknown): Promise<T> {
    logger.info(`[${this.constructor.name}.create] Creating record`, { data });
    const newRecord = await this.db.create({ data });
    await this.cacheManager.invalidateCache();
    return newRecord;
  }

  async update(id: string, data: unknown): Promise<T> {
    logger.info(`[${this.constructor.name}.update] Updating record`, { id, data });
    const updatedRecord = await this.db.update({
      where: { id },
      data,
    });
    await this.cacheManager.invalidateCache();
    return updatedRecord;
  }

  async delete(id: string): Promise<void> {
    logger.info(`[${this.constructor.name}.delete] Deleting record`, { id });
    await this.db.delete({ where: { id } });
    await this.cacheManager.invalidateCache();
  }

  async updateOrThrow(id: string, data: unknown, notFoundMessage = 'Record not found'): Promise<T> {
    logger.info(`[${this.constructor.name}.updateOrThrow] Updating record or throw`, { id, data });
    const record = await this.findById(id);
    if (!record) throw new AppError(notFoundMessage, 404);
    return this.update(id, data);
  }

  async deleteOrThrow(id: string, notFoundMessage = 'Record not found'): Promise<void> {
    logger.info(`[${this.constructor.name}.deleteOrThrow] Deleting record or throw`, { id });
    const record = await this.findById(id);
    if (!record) throw new AppError(notFoundMessage, 404);
    return this.delete(id);
  }

  async deleteAll(): Promise<void> {
    logger.info(`[${this.constructor.name}.deleteAll] Deleting all records`);
    if (this.db.deleteMany) {
      await this.db.deleteMany({});
      await this.cacheManager.invalidateCache();
    }
  }
}
