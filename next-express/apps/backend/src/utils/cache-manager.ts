export interface ICacheService {
  getOrSet<T>(key: string, fetcher: () => Promise<T>, expireSeconds?: number): Promise<T>;
  delPattern(pattern: string): Promise<void>;
}

export interface CacheOptions {
  keyPrefix: string;
  needCache: boolean;
  ttlSeconds?: number;
}

export class CacheManager {
  protected cacheOpts: CacheOptions;
  protected cacheService?: ICacheService;

  constructor(modelName: string, cacheOpts?: Partial<CacheOptions>, cacheService?: ICacheService) {
    this.cacheService = cacheService;
    this.cacheOpts = {
      keyPrefix: cacheOpts?.keyPrefix || modelName,
      needCache: cacheOpts?.needCache ?? false,
      ttlSeconds: cacheOpts?.ttlSeconds || 3600,
    };
    
    if (this.cacheOpts.needCache && !this.cacheService) {
      throw new Error(`Cache service is required when needCache is true for ${modelName} CacheManager.`);
    }
  }

  /**
   * Generate a cache key
   */
  getCacheKey(operation: string, identifier?: string | number): string {
    const base = `${this.cacheOpts.keyPrefix}:${operation}`;
    return identifier ? `${base}:${identifier}` : base;
  }

  /**
   * Execute an operation, using cache service if requested.
   * @param ttlSeconds - overrides the default TTL from cacheOpts for this specific call
   */
  async withCache<R>(
    operation: string,
    identifier: string | number | undefined,
    fetcher: () => Promise<R>,
    ttlSeconds?: number
  ): Promise<R> {
    if (!this.cacheOpts.needCache || !this.cacheService) {
      return fetcher();
    }

    const key = this.getCacheKey(operation, identifier);
    return this.cacheService.getOrSet(key, fetcher, ttlSeconds ?? this.cacheOpts.ttlSeconds);
  }

  /**
   * Invalidate cache for a specific model prefix
   */
  async invalidateCache(): Promise<void> {
    if (this.cacheOpts.needCache && this.cacheService) {
      await this.cacheService.delPattern(`${this.cacheOpts.keyPrefix}:*`);
    }
  }
}
