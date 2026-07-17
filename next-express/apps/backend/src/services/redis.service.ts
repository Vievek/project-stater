import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export class RedisService {
  /**
   * Set a value in Redis with an optional expiration time in seconds
   */
  static async set(key: string, value: any, expireSeconds?: number): Promise<void> {
    try {
      if (redisClient.status !== 'ready') return;
      const stringValue = JSON.stringify(value);
      if (expireSeconds) {
        await redisClient.setex(key, expireSeconds, stringValue);
      } else {
        await redisClient.set(key, stringValue);
      }
    } catch (err) {
      logger.warn(`Redis set failed for key ${key}: ${(err as Error).message}`);
    }
  }

  /**
   * Get a value from Redis
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (redisClient.status !== 'ready') return null;
      const value = await redisClient.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (err) {
      logger.warn(`Redis get failed for key ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Get a value from Redis, or execute the fetcher function, cache the result, and return it
   */
  static async getOrSet<T>(key: string, fetcher: () => Promise<T>, expireSeconds = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    // Cache miss or Redis is down, fetch from source
    const freshData = await fetcher();
    
    // Attempt to cache it (if Redis is down, this will just fail gracefully)
    await this.set(key, freshData, expireSeconds);
    
    return freshData;
  }

  /**
   * Delete a key from Redis
   */
  static async del(key: string): Promise<void> {
    try {
      if (redisClient.status !== 'ready') return;
      await redisClient.del(key);
    } catch (err) {
      logger.warn(`Redis del failed for key ${key}: ${(err as Error).message}`);
    }
  }

  /**
   * Delete keys matching a pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      if (redisClient.status !== 'ready') return;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      logger.warn(`Redis delPattern failed for pattern ${pattern}: ${(err as Error).message}`);
    }
  }
}
