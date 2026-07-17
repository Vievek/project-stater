import { UserService } from '../../user.service';
import { UserRepository } from '../../user.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { buildUserList } from '../factories/user.factory';
import fc from 'fast-check';

describe('UserService (Property Tests)', () => {
  let mockRepository: Partial<UserRepository>;
  let mockCacheService: ICacheService;
  let mockTxManager: Partial<ITransactionManager>;
  let service: UserService;

  beforeEach(() => {
    mockRepository = {
      findAllLatest: jest.fn(),
    };

    mockCacheService = {
      getOrSet: jest.fn().mockImplementation((key, fetcher) => fetcher()),
      delPattern: jest.fn(),
    };

    mockTxManager = {
      runInTransaction: jest.fn().mockImplementation((callback) => callback({})),
    };

    service = new UserService(
      mockRepository as UserRepository,
      mockCacheService,
      mockTxManager as ITransactionManager
    );
  });

  describe('getUserSummary', () => {
    it('should calculate summary and cache the result (fast-check edge cases)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), 
          fc.integer({ min: 0, max: 100 }), 
          async (total, completed) => {
            const actualCompleted = Math.min(completed, total);
            const users = buildUserList(total).map((t, idx) => ({ ...t, completed: idx < actualCompleted }));
            
            (mockRepository.findAllLatest as jest.Mock).mockResolvedValue(users);
            
            const result = await service.getUserSummary();
            
            expect(result).toEqual({ total, completed: actualCompleted });
            expect(mockCacheService.getOrSet).toHaveBeenCalledWith('user:svc:summary', expect.any(Function), 120);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
