import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../error-handler';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('errorHandler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should handle AppError and return the correct status and message', () => {
    const error = new AppError('Not Found', 404);

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(logger.warn).toHaveBeenCalledWith('Operational Error: Not Found', { statusCode: 404 });
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Not Found', data: null });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle generic Error and return 500 Internal server error', () => {
    const error = new Error('Database connection failed');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(logger.error).toHaveBeenCalledWith('Unhandled Error: Database connection failed', { stack: error.stack });
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error', data: null });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
