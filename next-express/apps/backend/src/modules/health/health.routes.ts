import { Router } from 'express';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', (req, res) => {
    logger.info('Health check endpoint called');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/error', (req, res, next) => {
    next(new AppError('This is a test error', 400));
  });

  return router;
}
