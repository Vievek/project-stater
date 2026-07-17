import { CategoryController } from '../../category.controller';
import { CategoryService } from '../../category.service';
import { Request, Response } from 'express';
import fc from 'fast-check';

describe('CategoryController (Property Tests)', () => {
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

  describe('getSummary property behavior', () => {
    it('should handle property-based arbitrary summary data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 0 }), fc.integer({ min: 0 }), async (total, completed) => {
          (mockService.getCategorySummary as jest.Mock).mockResolvedValue({ total, completed });
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
