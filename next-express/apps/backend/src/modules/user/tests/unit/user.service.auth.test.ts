import { UserService } from '../../user.service';
import { UserRepository } from '../../user.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { ITokenProvider, TokenPayload } from '../../../../infrastructure/token-provider';
import { buildUser, buildRegisterPayload } from '../factories/user.factory';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('bcrypt', () => ({
  hash:    jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import bcrypt from 'bcrypt';

// ─── Setup ────────────────────────────────────────────────────────────────────

function makeService(repoPartial: Partial<UserRepository> = {}) {
  const mockRepository = repoPartial as UserRepository;

  const mockCacheService: ICacheService = {
    getOrSet: jest.fn().mockImplementation((_key, fetcher) => fetcher()),
    delPattern: jest.fn(),
  };

  const mockTxManager: Partial<ITransactionManager> = {
    runInTransaction: jest.fn().mockImplementation((cb) => cb({})),
  };

  const mockTokenProvider: ITokenProvider = {
    sign:   jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-id-1', role: 'USER' } as TokenPayload),
  };

  const service = new UserService(
    mockRepository,
    mockCacheService,
    mockTxManager as ITransactionManager,
    mockTokenProvider,
  );

  return { service, mockRepository, mockTokenProvider };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserService — auth methods (Unit)', () => {

  // ── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    test.each([
      { role: undefined, expectedRole: 'USER' },
      { role: 'ADMIN',   expectedRole: 'ADMIN' },
    ])(
      'registers user with role=$role → stores hashed password, returns SafeUser + token',
      async ({ role, expectedRole }) => {
        const payload   = buildRegisterPayload({ role });
        const savedUser = buildUser({ ...payload, password: 'hashed-password', role: expectedRole });

        const { service, mockRepository, mockTokenProvider } = makeService({
          findByEmail: jest.fn().mockResolvedValue(null),     // no duplicate
          create:      jest.fn().mockResolvedValue(savedUser),
        });

        const result = await service.register(payload as any);

        // password was hashed before create
        expect(bcrypt.hash).toHaveBeenCalledWith(payload.password, 12);
        // token was signed with correct payload
        expect(mockTokenProvider.sign).toHaveBeenCalledWith({ sub: savedUser.id, role: savedUser.role });
        // result has no password field
        expect(result.user).not.toHaveProperty('password');
        expect(result.token).toBe('mock-jwt-token');
      },
    );

    it('throws 409 when email is already registered', async () => {
      const existing = buildUser();
      const { service } = makeService({
        findByEmail: jest.fn().mockResolvedValue(existing),
      });

      await expect(service.register(buildRegisterPayload() as any)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns SafeUser + token on valid credentials', async () => {
      const user   = buildUser({ password: 'hashed-password' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const { service, mockTokenProvider } = makeService({
        findByEmail: jest.fn().mockResolvedValue(user),
      });

      const result = await service.login(user.email, 'ValidPass123');

      expect(result.user).not.toHaveProperty('password');
      expect(result.token).toBe('mock-jwt-token');
      expect(mockTokenProvider.sign).toHaveBeenCalledWith({ sub: user.id, role: user.role });
    });

    test.each([
      { label: 'unknown email',    findResult: null,           compareResult: false, expectedCode: 401 },
      { label: 'wrong password',   findResult: buildUser(),    compareResult: false, expectedCode: 401 },
    ])(
      'throws $expectedCode for $label',
      async ({ findResult, compareResult, expectedCode }) => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(compareResult);
        const { service } = makeService({ findByEmail: jest.fn().mockResolvedValue(findResult) });

        await expect(service.login('any@example.com', 'wrongPass')).rejects.toMatchObject({
          statusCode: expectedCode,
        });
      },
    );
  });

  // ── verifyToken ────────────────────────────────────────────────────────────

  describe('verifyToken', () => {
    it('delegates to tokenProvider.verify and returns payload', () => {
      const { service, mockTokenProvider } = makeService({});
      const expectedPayload: TokenPayload = { sub: 'user-123', role: 'ADMIN' };
      (mockTokenProvider.verify as jest.Mock).mockReturnValue(expectedPayload);

      const result = service.verifyToken('some-token');
      expect(mockTokenProvider.verify).toHaveBeenCalledWith('some-token');
      expect(result).toEqual(expectedPayload);
    });

    it('throws 500 when no tokenProvider is configured', () => {
      const service = new UserService({} as UserRepository);
      expect(() => service.verifyToken('token')).toThrow(expect.objectContaining({ statusCode: 500 }));
    });
  });
});
