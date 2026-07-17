import { Request, Response, NextFunction } from 'express';
import { validate } from '../validate';
import { z } from 'zod';

describe('validate Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const schema = z.object({
    body: z.object({
      name: z.string(),
      age: z.number().optional(),
    }).optional(),
    query: z.object({
      page: z.string().optional(),
    }).optional(),
    params: z.object({
      id: z.string().optional(),
    }).optional(),
  });

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {},
    };
    mockNext = jest.fn();
  });

  it('should validate and sanitize request data successfully', async () => {
    mockReq.body = { name: 'John Doe', age: 30, unknownProp: 'strip this' };
    mockReq.query = { page: '1' };

    const middleware = validate(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body).toEqual({ name: 'John Doe', age: 30 }); // unknownProp stripped
    expect(mockRes.locals?.validated?.query).toEqual({ page: '1' });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should return 400 when validation fails', async () => {
    mockReq.body = { age: 'not a number' }; // name is required, age should be number

    const middleware = validate(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation Error',
        data: expect.any(Array),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next with error if an unexpected error occurs', async () => {
    const errorSchema = z.object({
      body: z.any().transform(() => {
        throw new Error('Unexpected error');
      }),
    });

    const middleware = validate(errorSchema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
