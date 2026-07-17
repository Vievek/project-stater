import { TodoController } from '../../todo.controller';
import { TodoService } from '../../todo.service';
import { Request, Response } from 'express';

describe('TodoController (Unit)', () => {
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

  describe('getSummary', () => {
    test.each([
      { total: 0, completed: 0 },
      { total: 5, completed: 3 },
      { total: 10, completed: 10 },
    ])('should return summary %j via ApiResponse', async (summary) => {
      (mockService.getTodoSummary as jest.Mock).mockResolvedValue(summary);
      await controller.getSummary(mockReq as Request, mockRes as Response, jest.fn());

      expect(mockService.getTodoSummary).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: summary,
        })
      );
    });
  });
});
