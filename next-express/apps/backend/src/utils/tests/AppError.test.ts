import { AppError } from '../AppError';

describe('AppError (Unit)', () => {
  it('should create an error with message and status code', () => {
    const error = new AppError('Test error message', 400);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error message');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('should capture stack trace', () => {
    const error = new AppError('Error with stack', 500);
    expect(error.stack).toBeDefined();
  });
});
