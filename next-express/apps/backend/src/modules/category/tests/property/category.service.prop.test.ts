import { CategoryService } from '../../category.service';
import { CategoryRepository } from '../../category.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { buildCategoryList } from '../factories/category.factory';
import fc from 'fast-check';

describe('CategoryService (Property Tests)', () => {
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

  describe('getCategorySummary', () => {
    it('should calculate summary and cache the result (fast-check edge cases)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), 
          async (total) => {
            const categorys = buildCategoryList(total);
            
            (mockRepository.findAllLatest as jest.Mock).mockResolvedValue(categorys);
            
            const result = await service.getCategorySummary();
            
            expect(result).toEqual({ total });
            expect(mockCacheService.getOrSet).toHaveBeenCalledWith('category:svc:summary', expect.any(Function), 120);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
