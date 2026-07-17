import { BaseRepository, IDbClient, ICacheService } from '../base.repository';

// Concrete implementation of BaseRepository for testing
class TestRepository extends BaseRepository<any> {
  constructor(db: IDbClient<any>, cache: ICacheService) {
    super(db, 'test-model', { needCache: true, ttlSeconds: 60 }, cache);
  }
}

describe('BaseRepository (Unit)', () => {
  let mockDbClient: IDbClient<any>;
  let mockCacheService: ICacheService;
  let repository: TestRepository;

  beforeEach(() => {
    // Pure DI mock setup (Framework agnostic logic)
    mockDbClient = {
      findMany: jest.fn().mockResolvedValue([{ id: '1', name: 'Item 1' }]),
      findUnique: jest.fn().mockResolvedValue({ id: '1', name: 'Item 1' }),
      create: jest.fn().mockResolvedValue({ id: '1', name: 'Item 1' }),
      update: jest.fn().mockResolvedValue({ id: '1', name: 'Updated Item' }),
      delete: jest.fn().mockResolvedValue({ id: '1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };

    mockCacheService = {
      getOrSet: jest.fn().mockImplementation((key, fetcher) => fetcher()),
      delPattern: jest.fn().mockResolvedValue(undefined),
    };

    repository = new TestRepository(mockDbClient, mockCacheService);
  });

  describe('findAll', () => {
    it('should return all items and use cache', async () => {
      const result = await repository.findAll();
      expect(result).toHaveLength(1);
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith('test-model:repo:findAll:{}', expect.any(Function), 60);
      expect(mockDbClient.findMany).toHaveBeenCalledWith();
    });

    it('should apply pagination parameters', async () => {
      await repository.findAll({ pagination: { page: 2, pageSize: 10 } });
      expect(mockDbClient.findMany).toHaveBeenCalledWith({ skip: 10, take: 10 });
    });
  });

  describe('findById', () => {
    it('should return item by id (no cache by default in base)', async () => {
      const result = await repository.findById('1');
      expect(result).toEqual({ id: '1', name: 'Item 1' });
      expect(mockDbClient.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('create', () => {
    it('should create an item and invalidate cache', async () => {
      const result = await repository.create({ name: 'Item 1' });
      expect(result.id).toBe('1');
      expect(mockDbClient.create).toHaveBeenCalledWith({ data: { name: 'Item 1' } });
      expect(mockCacheService.delPattern).toHaveBeenCalledWith('test-model:*');
    });
  });

  describe('update', () => {
    it('should update an item and invalidate cache', async () => {
      await repository.update('1', { name: 'Updated' });
      expect(mockDbClient.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { name: 'Updated' } });
      expect(mockCacheService.delPattern).toHaveBeenCalledWith('test-model:*');
    });
  });

  describe('delete', () => {
    it('should delete an item and invalidate cache', async () => {
      await repository.delete('1');
      expect(mockDbClient.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockCacheService.delPattern).toHaveBeenCalledWith('test-model:*');
    });
  });
});
