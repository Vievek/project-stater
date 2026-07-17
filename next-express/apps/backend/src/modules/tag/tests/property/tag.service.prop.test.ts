import { TagService } from '../../tag.service';
import { TagRepository } from '../../tag.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { buildTagList } from '../factories/tag.factory';
import fc from 'fast-check';

describe('TagService (Property Tests)', () => {
  let mockRepository: Partial<TagRepository>;
  let mockCacheService: ICacheService;
  let mockTxManager: Partial<ITransactionManager>;
  let service: TagService;

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

    service = new TagService(
      mockRepository as TagRepository,
      mockCacheService,
      mockTxManager as ITransactionManager
    );
  });

  describe('getTagSummary', () => {
    it('should calculate summary and cache the result (fast-check edge cases)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), 
          async (total) => {
            const tags = buildTagList(total);
            
            (mockRepository.findAllLatest as jest.Mock).mockResolvedValue(tags);
            
            const result = await service.getTagSummary();
            
            expect(result).toEqual({ total });
            expect(mockCacheService.getOrSet).toHaveBeenCalledWith('tag:svc:summary', expect.any(Function), 120);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
