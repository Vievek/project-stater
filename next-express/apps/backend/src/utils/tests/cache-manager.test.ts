import { CacheManager, ICacheService } from '../cache-manager';

describe('CacheManager (Unit)', () => {
  let mockCacheService: ICacheService;

  beforeEach(() => {
    mockCacheService = {
      getOrSet: jest.fn().mockImplementation((key, fetcher) => fetcher()),
      delPattern: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should throw error if needCache is true but no cacheService provided', () => {
    expect(() => new CacheManager('test', { needCache: true })).toThrow();
  });

  it('should create CacheManager if needCache is false and no cacheService provided', () => {
    expect(() => new CacheManager('test', { needCache: false })).not.toThrow();
  });

  describe('getCacheKey', () => {
    it('should generate key without identifier', () => {
      const cacheManager = new CacheManager('test', { needCache: true }, mockCacheService);
      expect(cacheManager.getCacheKey('findAll')).toBe('test:findAll');
    });

    it('should generate key with identifier', () => {
      const cacheManager = new CacheManager('test', { needCache: true }, mockCacheService);
      expect(cacheManager.getCacheKey('findById', '123')).toBe('test:findById:123');
    });
  });

  describe('withCache', () => {
    it('should bypass cache if needCache is false', async () => {
      const cacheManager = new CacheManager('test', { needCache: false }, mockCacheService);
      const fetcher = jest.fn().mockResolvedValue('data');
      
      const result = await cacheManager.withCache('op', '1', fetcher);
      
      expect(result).toBe('data');
      expect(mockCacheService.getOrSet).not.toHaveBeenCalled();
      expect(fetcher).toHaveBeenCalled();
    });

    it('should use cacheService if needCache is true', async () => {
      const cacheManager = new CacheManager('test', { needCache: true, ttlSeconds: 100 }, mockCacheService);
      const fetcher = jest.fn().mockResolvedValue('data');
      
      const result = await cacheManager.withCache('op', '1', fetcher);
      
      expect(result).toBe('data');
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith('test:op:1', fetcher, 100);
    });

    it('should respect custom ttl in withCache call', async () => {
      const cacheManager = new CacheManager('test', { needCache: true, ttlSeconds: 100 }, mockCacheService);
      const fetcher = jest.fn().mockResolvedValue('data');
      
      await cacheManager.withCache('op', '1', fetcher, 50);
      
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith('test:op:1', fetcher, 50);
    });
  });

  describe('invalidateCache', () => {
    it('should not invalidate if needCache is false', async () => {
      const cacheManager = new CacheManager('test', { needCache: false }, mockCacheService);
      await cacheManager.invalidateCache();
      expect(mockCacheService.delPattern).not.toHaveBeenCalled();
    });

    it('should call delPattern if needCache is true', async () => {
      const cacheManager = new CacheManager('test', { needCache: true }, mockCacheService);
      await cacheManager.invalidateCache();
      expect(mockCacheService.delPattern).toHaveBeenCalledWith('test:*');
    });
  });
});
