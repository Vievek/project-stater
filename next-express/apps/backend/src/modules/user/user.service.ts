import bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { User } from './user.types';
import { BaseService } from '../../base-classes/base.service';
import { QueryOptions } from '../../utils/query-builder';
import { CacheManager, ICacheService } from '../../utils/cache-manager';
import { ITransactionManager } from '../../utils/transaction-manager';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const BCRYPT_ROUNDS = 12;

export class UserService extends BaseService<User, UserRepository> {
  private cacheManager: CacheManager;

  constructor(
    repository: UserRepository,
    cacheService?: ICacheService,
    private transactionManager?: ITransactionManager,
  ) {
    super(repository);
    // By using 'user' as the prefix (same as the repository),
    // cache is automatically invalidated when DB mutations happen.
    this.cacheManager = new CacheManager('user', { needCache: true, ttlSeconds: 120 }, cacheService);
  }

  // ─── Overrides ──────────────────────────────────────────────────────────────

  /** Override getAll to use the custom repository method. */
  async getAll(options?: QueryOptions): Promise<User[]> {
    logger.info(`[${this.constructor.name}.getAll] Fetching all latest`, { options });
    return this.repository.findAllLatest(options);
  }

  /**
   * Override create to hash the password before persisting.
   * Never store plaintext passwords.
   */
  async create(data: Record<string, unknown>): Promise<User> {
    logger.info(`[${this.constructor.name}.create] Hashing password before create`);
    const { password, ...rest } = data as { password?: string } & Record<string, unknown>;

    if (password) {
      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
      return this.repository.create({ ...rest, password: hashed });
    }

    return this.repository.create(data);
  }



  // ─── Cache example ───────────────────────────────────────────────────────────

  /** Cached user summary aggregation. */
  async getUserSummary(): Promise<{ total: number }> {
    logger.info(`[${this.constructor.name}.getUserSummary] Fetching summary`);
    return this.cacheManager.withCache('svc:summary', undefined, async () => {
      const all = await this.getAll();
      return { total: all.length };
    });
  }

  // ─── Transaction Manager example ─────────────────────────────────────────────
  /*
   * EXAMPLE: Using the Transaction Manager
   *
   * async executeComplexBusinessLogic(data: CreateUserInput): Promise<void> {
   *   if (!this.transactionManager) throw new AppError('Transaction manager not available', 500);
   *
   *   await this.transactionManager.runInTransaction(async (txDb) => {
   *     const txRepo = new UserRepository(txDb.user, this.cacheManager.getCacheService());
   *     const user = await txRepo.create(data);
   *     await txRepo.update(user.id, { completed: true });
   *   });
   * }
   */

  // ─── Private helpers ──────────────────────────────────────────────────────────

}
