import { AuthService } from '../../auth.service';
import { UserRepository } from '../../../user/user.repository';
import { ITokenProvider } from '../../../../infrastructure/token-provider';
import fc from 'fast-check';
import bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('AuthService (Property Tests)', () => {
  let mockRepository: Partial<UserRepository>;
  let mockTokenProvider: Partial<ITokenProvider>;
  let service: AuthService;

  beforeEach(() => {
    mockRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, id: 'user-id' })),
    };

    mockTokenProvider = {
      sign: jest.fn().mockReturnValue('mock-token'),
    };

    service = new AuthService(
      mockRepository as UserRepository,
      mockTokenProvider as ITokenProvider
    );
  });

  describe('register property test', () => {
    it('should always hash the password and sign token for valid random inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1 }),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8 }),
            role: fc.constantFrom('USER', 'ADMIN', undefined)
          }),
          async (payload) => {
            const result = await service.register(payload);
            
            expect(bcrypt.hash).toHaveBeenCalledWith(payload.password, 12);
            expect(result.token).toBe('mock-token');
            expect(result.user).not.toHaveProperty('password');
            expect(result.user.email).toBe(payload.email);
            
            // clear mock for next run
            (bcrypt.hash as jest.Mock).mockClear();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
