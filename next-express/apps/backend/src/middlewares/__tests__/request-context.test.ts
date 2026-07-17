import { Request, Response, NextFunction } from 'express';
import { requestContextMiddleware } from '../request-context';
import { asyncLocalStorage } from '../../utils/logger';

jest.mock('../../utils/logger', () => ({
  asyncLocalStorage: {
    run: jest.fn((id, callback) => callback()),
  },
}));

describe('requestContextMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should set X-Request-Id header and run asyncLocalStorage', () => {
    requestContextMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-Id', expect.any(String));
    expect(asyncLocalStorage.run).toHaveBeenCalledWith(expect.any(String), expect.any(Function));
    expect(mockNext).toHaveBeenCalled();
  });
});
