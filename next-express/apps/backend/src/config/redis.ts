import { Redis } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redisClient = new Redis(env.REDIS_URL);

redisClient.on('connect', () => {
  logger.info('Successfully connected to Redis');
});

redisClient.on('error', (err) => {
  logger.warn('Redis is down or connection error occurred - bypassing cache and hitting DB directly', { error: err.message });
});
