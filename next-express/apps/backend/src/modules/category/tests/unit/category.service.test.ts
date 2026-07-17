import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../category.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { buildCategoryList } from '../factories/category.factory';

describe('CategoryService (Unit)', () => {
  let mockRepository: Partial<CategoryRepository>;
  let mockCacheService: ICacheService;
  let mockTxManager: Partial<ITransactionManager>;
  let service: CategoryService;

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

    service = new CategoryService(
      mockRepository as CategoryRepository,
      mockCacheService,
      mockTxManager as ITransactionManager
    );
  });

  describe('getAll', () => {
    test.each([
      { page: 1, pageSize: 10, categorysCount: 2 },
      { page: 2, pageSize: 5, categorysCount: 5 },
      { page: 1, pageSize: 0, categorysCount: 0 },
    ])('should delegate to repository.findAllLatest with %j', async ({ page, pageSize, categorysCount }) => {
      const mockCategorys = buildCategoryList(categorysCount);
      (mockRepository.findAllLatest as jest.Mock).mockResolvedValue(mockCategorys);

      const result = await service.getAll({ pagination: { page, pageSize } });
      
      expect(result).toHaveLength(categorysCount);
      expect(mockRepository.findAllLatest).toHaveBeenCalledWith({ pagination: { page, pageSize } });
    });
  });
});
