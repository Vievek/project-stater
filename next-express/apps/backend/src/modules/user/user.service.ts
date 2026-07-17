import bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { User } from './user.types';
import { BaseService } from '../../base-classes/base.service';
import { QueryOptions } from '../../utils/query-builder';
import { CacheManager, ICacheService } from '../../utils/cache-manager';
import { ITransactionManager } from '../../utils/transaction-manager';
import { ITokenProvider, TokenPayload } from '../../infrastructure/token-provider';
import { SafeUser, toSafeUser } from '../../utils/safe-user';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const BCRYPT_ROUNDS = 12;

export class UserService extends BaseService<User, UserRepository> {
  private cacheManager: CacheManager;

  constructor(
    repository: UserRepository,
    cacheService?: ICacheService,
    private transactionManager?: ITransactionManager,
    private tokenProvider?: ITokenProvider,
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

  // ─── Auth methods ────────────────────────────────────────────────────────────

  /**
   * Registers a new user.
   * - Hashes the password before persisting.
   * - Checks for duplicate email and throws 409 if found.
   * - Returns a SafeUser (no password) + signed JWT.
   */
  async register(
    data: { name: string; email: string; password: string; role?: string },
  ): Promise<{ user: SafeUser; token: string }> {
    logger.info(`[${this.constructor.name}.register] Registering user`, { email: data.email });

    // Check for duplicate email
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email is already registered', 409);
    }

    const hashed = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const created = await this.repository.create({
      ...data,
      password: hashed,
      role: data.role ?? 'USER',
    });

    const token = this.signToken(created);
    return { user: toSafeUser(created), token };
  }

  /**
   * Authenticates a user by email and password.
   * - Throws 401 for unknown email or wrong password.
   * - Returns a SafeUser (no password) + signed JWT.
   */
  async login(
    email: string,
    password: string,
  ): Promise<{ user: SafeUser; token: string }> {
    logger.info(`[${this.constructor.name}.login] Login attempt`, { email });

    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = this.signToken(user);
    return { user: toSafeUser(user), token };
  }

  /**
   * Verifies a raw token string and returns its payload.
   * Delegates to the injected ITokenProvider.
   * @throws AppError(401) on invalid/expired token.
   */
  verifyToken(token: string): TokenPayload {
    if (!this.tokenProvider) {
      throw new AppError('Token provider not configured', 500);
    }
    return this.tokenProvider.verify(token);
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

  private signToken(user: User): string {
    if (!this.tokenProvider) {
      throw new AppError('Token provider not configured', 500);
    }
    return this.tokenProvider.sign({ sub: user.id, role: user.role });
  }
}
