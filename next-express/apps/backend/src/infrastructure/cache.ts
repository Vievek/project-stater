/**
 * Cache infrastructure adapter — Redis swap point.
 *
 * This is the ONLY file that imports RedisService (and therefore ioredis).
 * To swap the cache provider, replace RedisService with your new adapter
 * that satisfies the ICacheService interface. Nothing else changes.
 */
import { ICacheService } from '../base-classes/base.repository';
import { RedisService } from '../services/redis.service';

export const cacheService: ICacheService = RedisService;
