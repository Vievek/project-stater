import bcrypt from 'bcrypt';
import { UserRepository } from '../user/user.repository';
import { User } from '../user/user.types';
import { ITokenProvider, TokenPayload } from '../../infrastructure/token-provider';
import { SafeUser, toSafeUser } from '../../utils/safe-user';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = '$2b$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha';

export class AuthService {
  constructor(
    private repository: UserRepository,
    private tokenProvider: ITokenProvider,
  ) {}

  /**
   * Registers a new user.
   * - Hashes the password before persisting.
   * - Checks for duplicate email and throws 409 if found.
   * - Returns a SafeUser (no password) + signed JWT.
   */
  async register(
    data: { name: string; email: string; password: string; role?: string },
  ): Promise<{ user: SafeUser; token: string }> {
    if (!this.tokenProvider) {
      throw new AppError('Token provider not configured', 500);
    }
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
    if (!this.tokenProvider) {
      throw new AppError('Token provider not configured', 500);
    }
    logger.info(`[${this.constructor.name}.login] Login attempt`, { email });

    const user = await this.repository.findByEmail(email);
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
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

  private signToken(user: User): string {
    if (!this.tokenProvider) {
      throw new AppError('Token provider not configured', 500);
    }
    return this.tokenProvider.sign({ sub: user.id, role: user.role });
  }
}
