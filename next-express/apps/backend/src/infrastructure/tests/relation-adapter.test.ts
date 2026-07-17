import { PrismaRelationAdapter } from '../relation-adapter';

describe('PrismaRelationAdapter', () => {
  let mockModel: any;
  let adapter: PrismaRelationAdapter<any>;

  beforeEach(() => {
    mockModel = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    };
    adapter = new PrismaRelationAdapter(mockModel);
  });

  describe('findManyWithRelations', () => {
    it('calls findMany with where and include clauses', async () => {
      mockModel.findMany.mockResolvedValue([{ id: '1' }]);
      const result = await adapter.findManyWithRelations({ status: 'active' }, ['author', 'tags']);

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        include: { author: true, tags: true },
      });
      expect(result).toEqual([{ id: '1' }]);
    });

    it('omits where if undefined', async () => {
      mockModel.findMany.mockResolvedValue([]);
      await adapter.findManyWithRelations(undefined, ['tags']);

      expect(mockModel.findMany).toHaveBeenCalledWith({
        include: { tags: true },
      });
    });

    it('omits include if relations array is empty', async () => {
      mockModel.findMany.mockResolvedValue([]);
      await adapter.findManyWithRelations({ status: 'active' }, []);

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });
  });

  describe('findUniqueWithRelations', () => {
    it('calls findUnique with id and include clauses', async () => {
      mockModel.findUnique.mockResolvedValue({ id: '1' });
      const result = await adapter.findUniqueWithRelations('1', ['author', 'tags']);

      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { author: true, tags: true },
      });
      expect(result).toEqual({ id: '1' });
    });

    it('omits include if relations array is empty', async () => {
      mockModel.findUnique.mockResolvedValue({ id: '1' });
      await adapter.findUniqueWithRelations('1', []);

      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('connectRelation', () => {
    it('calls update with connect mutation', async () => {
      mockModel.update.mockResolvedValue({ id: '1' });
      const result = await adapter.connectRelation('1', 'tags', ['t1', 't2']);

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { tags: { connect: [{ id: 't1' }, { id: 't2' }] } },
        include: { tags: true },
      });
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('disconnectRelation', () => {
    it('calls update with disconnect mutation', async () => {
      mockModel.update.mockResolvedValue({ id: '1' });
      const result = await adapter.disconnectRelation('1', 'tags', ['t1', 't2']);

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { tags: { disconnect: [{ id: 't1' }, { id: 't2' }] } },
        include: { tags: true },
      });
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('setRelation', () => {
    it('calls update with set mutation', async () => {
      mockModel.update.mockResolvedValue({ id: '1' });
      const result = await adapter.setRelation('1', 'tags', ['t1', 't2']);

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { tags: { set: [{ id: 't1' }, { id: 't2' }] } },
        include: { tags: true },
      });
      expect(result).toEqual({ id: '1' });
    });
  });
});
