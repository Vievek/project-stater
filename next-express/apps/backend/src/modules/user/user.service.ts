import { UserRepository } from './user.repository';
import { User } from './user.types';
import { BaseService } from '../../base-classes/base.service';
import { QueryOptions } from '../../utils/query-builder';
import { CacheManager, ICacheService } from '../../utils/cache-manager';
import { ITransactionManager } from '../../utils/transaction-manager';
import { logger } from '../../utils/logger';

export class UserService extends BaseService<User, UserRepository> {
  private cacheManager: CacheManager;

  constructor(
    repository: UserRepository,
    cacheService?: ICacheService,
    private transactionManager?: ITransactionManager
  ) {
    super(repository);
    // Example of using CacheManager in the service layer
    // By using 'user' as the prefix (same as the repository), 
    // it will be automatically invalidated when DB mutations happen!
    this.cacheManager = new CacheManager('user', { needCache: true, ttlSeconds: 120 }, cacheService);
  }
  // Overriding getAll to use the custom repository method
  async getAll(options?: QueryOptions): Promise<User[]> {
    logger.info(`[${this.constructor.name}.getAll] Fetching all latest`, { options });
    return this.repository.findAllLatest(options);
  }

  /*
   * EXAMPLE: Using the Transaction Manager
   * 
   * This demonstrates how to adhere to the Open-Closed Principle (OCP).
   * By using `this.transactionManager`, the service layer remains unaware
   * that it's using Prisma under the hood. 
   * 
   * async executeComplexBusinessLogic(data: CreateUserInput): Promise<void> {
   *   if (!this.transactionManager) throw new AppError('Transaction manager not available', 500);
   * 
   *   await this.transactionManager.runInTransaction(async (txDb) => {
   *     // Inside the transaction, instantiate repositories with the transactional db client `txDb`
   *     const txRepo = new UserRepository(txDb.user, this.cacheManager.getCacheService());
   *     
   *     // Perform multiple coordinated operations atomically
   *     const user = await txRepo.create(data);
   *     await txRepo.update(user.id, { completed: true });
   *   });
   * }
   */

  // Example of caching a complex computation or aggregation in the service layer
  async getUserSummary(): Promise<{ total: number }> {
    logger.info(`[${this.constructor.name}.getUserSummary] Fetching summary`);
    return this.cacheManager.withCache('svc:summary', undefined, async () => {
      const all = await this.getAll();
      return {
        total: all.length,
      };
    });
  }
}
