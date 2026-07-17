import { TodoController } from '../../todo.controller';
import { TodoService } from '../../todo.service';
import { Request, Response } from 'express';
import fc from 'fast-check';

describe('TodoController (Property Tests)', () => {
  let mockService: Partial<TodoService>;
  let controller: TodoController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getTodoSummary: jest.fn(),
    };
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    controller = new TodoController(mockService as TodoService);
  });

  describe('getSummary property behavior', () => {
    it('should handle property-based arbitrary summary data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 0 }), fc.integer({ min: 0 }), async (total, completed) => {
          (mockService.getTodoSummary as jest.Mock).mockResolvedValue({ total, completed });
          await controller.getSummary(mockReq as Request, mockRes as Response, jest.fn());
          
          expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: { total, completed } })
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
