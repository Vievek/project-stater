import { BaseController } from '../base.controller';
import { BaseService } from '../base.service';
import { Request, Response } from 'express';

class TestController extends BaseController<any, BaseService<any, any>> {
  constructor(service: BaseService<any, any>) {
    super(service);
  }
}

describe('BaseController (Unit)', () => {
  let mockService: Partial<BaseService<any, any>>;
  let controller: TestController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getAll: jest.fn().mockResolvedValue([{ id: '1', name: 'Item 1' }]),
      getById: jest.fn().mockResolvedValue({ id: '1', name: 'Item 1' }),
      create: jest.fn().mockResolvedValue({ id: '1', name: 'Item 1' }),
      update: jest.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockReq = {
      params: {},
      query: {},
      body: {},
    };

    // In Express 5, req.query/req.params are read-only.
    // The validate middleware stores sanitized data in res.locals.validated.
    // Unit tests must mirror this pattern by populating res.locals.validated directly.
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      locals: {
        validated: {
          query: {},
          params: {},
        },
      },
    };

    controller = new TestController(mockService as BaseService<any, any>);
  });

  describe('getAll', () => {
    it('should fetch all items and return success response', async () => {
      // Simulate validate middleware setting res.locals.validated.query
      mockRes.locals!.validated.query = { page: 1 };
      await controller.getAll(mockReq as Request, mockRes as Response, jest.fn());
      
      expect(mockService.getAll).toHaveBeenCalledWith({ page: 1 });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [{ id: '1', name: 'Item 1' }] })
      );
    });
  });

  describe('getById', () => {
    it('should fetch item by id and return success response', async () => {
      mockRes.locals!.validated.params = { id: '1' };
      await controller.getById(mockReq as Request, mockRes as Response, jest.fn());
      
      expect(mockService.getById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: '1', name: 'Item 1' } })
      );
    });
  });

  describe('create', () => {
    it('should create item and return 201 response', async () => {
      mockReq.body = { name: 'Item 1' };
      await controller.create(mockReq as Request, mockRes as Response, jest.fn());
      
      expect(mockService.create).toHaveBeenCalledWith({ name: 'Item 1' });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Created successfully' })
      );
    });
  });

  describe('update', () => {
    it('should update item and return success response', async () => {
      mockRes.locals!.validated.params = { id: '1' };
      mockReq.body = { name: 'Updated' };
      await controller.update(mockReq as Request, mockRes as Response, jest.fn());
      
      expect(mockService.update).toHaveBeenCalledWith('1', { name: 'Updated' });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Updated successfully' })
      );
    });
  });

  describe('delete', () => {
    it('should delete item and return 204 response', async () => {
      mockRes.locals!.validated.params = { id: '1' };
      await controller.delete(mockReq as Request, mockRes as Response, jest.fn());
      
      expect(mockService.delete).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });
});
