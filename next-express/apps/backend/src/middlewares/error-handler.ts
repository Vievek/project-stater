import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.message}`, { statusCode: err.statusCode });
    res.status(err.statusCode).json(ApiResponse.error(err.message));
    return;
  }

  // Unhandled internal server errors
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json(ApiResponse.error('Internal server error'));
};
