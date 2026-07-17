import { Request, Response, NextFunction } from 'express';
import { asyncLocalStorage } from '../utils/logger';

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const reqId = crypto.randomUUID();
  res.setHeader('X-Request-Id', reqId);

  asyncLocalStorage.run(reqId, () => {
    next();
  });
};
