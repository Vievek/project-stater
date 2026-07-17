import { UserService } from '../../user.service';
import { UserRepository } from '../../user.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { buildUserList } from '../factories/user.factory';

describe('UserService (Unit)', () => {
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

  describe('getAll', () => {
    test.each([
      { page: 1, pageSize: 10, usersCount: 2 },
      { page: 2, pageSize: 5, usersCount: 5 },
      { page: 1, pageSize: 0, usersCount: 0 },
    ])('should delegate to repository.findAllLatest with %j', async ({ page, pageSize, usersCount }) => {
      const mockUsers = buildUserList(usersCount);
      (mockRepository.findAllLatest as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.getAll({ pagination: { page, pageSize } });
      
      expect(result).toHaveLength(usersCount);
      expect(mockRepository.findAllLatest).toHaveBeenCalledWith({ pagination: { page, pageSize } });
    });
  });
});
