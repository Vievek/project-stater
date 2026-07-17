import { CategoryController } from '../../category.controller';
import { CategoryService } from '../../category.service';
import { Request, Response } from 'express';

describe('CategoryController (Unit)', () => {
  let mockService: Partial<CategoryService>;
  let controller: CategoryController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getCategorySummary: jest.fn(),
    };
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    controller = new CategoryController(mockService as CategoryService);
  });

  describe('getSummary', () => {
    test.each([
      { total: 0, completed: 0 },
      { total: 5, completed: 3 },
      { total: 10, completed: 10 },
    ])('should return summary %j via ApiResponse', async (summary) => {
      (mockService.getCategorySummary as jest.Mock).mockResolvedValue(summary);
      await controller.getSummary(mockReq as Request, mockRes as Response, jest.fn());

      expect(mockService.getCategorySummary).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: summary,
        })
      );
    });
  });
});
