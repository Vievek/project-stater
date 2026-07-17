import { BaseService } from '../base.service';
import { BaseRepository } from '../base.repository';

// Concrete implementation of BaseService for testing
class TestService extends BaseService<any, BaseRepository<any>> {
  constructor(repository: BaseRepository<any>) {
    super(repository);
  }
}

describe('BaseService (Unit)', () => {
  let mockRepository: Partial<BaseRepository<any>>;
  let service: TestService;

  beforeEach(() => {
    // Pure DI mock setup
    mockRepository = {
      findAll: jest.fn().mockResolvedValue([{ id: '1', name: 'Item 1' }]),
      findById: jest.fn().mockResolvedValue({ id: '1', name: 'Item 1' }),
      create: jest.fn().mockResolvedValue({ id: '1', name: 'Item 1' }),
      updateOrThrow: jest.fn().mockResolvedValue({ id: '1', name: 'Updated Item' }),
      deleteOrThrow: jest.fn().mockResolvedValue(undefined),
    };

    // Cast as any here since we only mock the methods BaseService uses
    service = new TestService(mockRepository as BaseRepository<any>);
  });

  describe('getAll', () => {
    it('should return all items', async () => {
      const result = await service.getAll();
      expect(result).toHaveLength(1);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return item by id', async () => {
      const result = await service.getById('1');
      expect(result).toEqual({ id: '1', name: 'Item 1' });
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw AppError if not found', async () => {
      mockRepository.findById = jest.fn().mockResolvedValue(null);
      await expect(service.getById('non-existent')).rejects.toThrow('Record not found');
    });
  });

  describe('create', () => {
    it('should create an item', async () => {
      const result = await service.create({ name: 'Item 1' });
      expect(result.id).toBe('1');
      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'Item 1' });
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const result = await service.update('1', { name: 'Updated' });
      expect(result.name).toBe('Updated Item');
      expect(mockRepository.updateOrThrow).toHaveBeenCalledWith('1', { name: 'Updated' }, undefined);
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      await service.delete('1');
      expect(mockRepository.deleteOrThrow).toHaveBeenCalledWith('1', undefined);
    });
  });
});
