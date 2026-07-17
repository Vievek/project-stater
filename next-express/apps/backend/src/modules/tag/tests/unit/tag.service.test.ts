import { TagService } from '../../tag.service';
import { TagRepository } from '../../tag.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { buildTagList } from '../factories/tag.factory';

describe('TagService (Unit)', () => {
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

  describe('getAll', () => {
    test.each([
      { page: 1, pageSize: 10, tagsCount: 2 },
      { page: 2, pageSize: 5, tagsCount: 5 },
      { page: 1, pageSize: 0, tagsCount: 0 },
    ])('should delegate to repository.findAllLatest with %j', async ({ page, pageSize, tagsCount }) => {
      const mockTags = buildTagList(tagsCount);
      (mockRepository.findAllLatest as jest.Mock).mockResolvedValue(mockTags);

      const result = await service.getAll({ pagination: { page, pageSize } });
      
      expect(result).toHaveLength(tagsCount);
      expect(mockRepository.findAllLatest).toHaveBeenCalledWith({ pagination: { page, pageSize } });
    });
  });
});
