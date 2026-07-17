import { UserController } from '../../user.controller';
import { UserService } from '../../user.service';
import { Request, Response } from 'express';

describe('UserController (Unit)', () => {
  let mockService: Partial<UserService>;
  let controller: UserController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getUserSummary: jest.fn(),
    };
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    controller = new UserController(mockService as UserService);
  });

  describe('getSummary', () => {
    test.each([
      { total: 0, completed: 0 },
      { total: 5, completed: 3 },
      { total: 10, completed: 10 },
    ])('should return summary %j via ApiResponse', async (summary) => {
      (mockService.getUserSummary as jest.Mock).mockResolvedValue(summary);
      await controller.getSummary(mockReq as Request, mockRes as Response, jest.fn());

      expect(mockService.getUserSummary).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: summary,
        })
      );
    });
  });
});
