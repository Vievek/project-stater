import { TagController } from '../../tag.controller';
import { TagService } from '../../tag.service';
import { Request, Response } from 'express';

describe('TagController (Unit)', () => {
  let mockService: Partial<TagService>;
  let controller: TagController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getTagSummary: jest.fn(),
    };
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    controller = new TagController(mockService as TagService);
  });

  describe('getSummary', () => {
    test.each([
      { total: 0, completed: 0 },
      { total: 5, completed: 3 },
      { total: 10, completed: 10 },
    ])('should return summary %j via ApiResponse', async (summary) => {
      (mockService.getTagSummary as jest.Mock).mockResolvedValue(summary);
      await controller.getSummary(mockReq as Request, mockRes as Response, jest.fn());

      expect(mockService.getTagSummary).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: summary,
        })
      );
    });
  });
});
