import { Manifest } from '../../../../generate-modules';

export function generateActionsTestTemplate(manifest: Manifest): string {
  const { moduleName, modelName } = manifest;

  return `
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from '../../actions/${moduleName}.actions';
import { ${moduleName}Service } from '../../services/${moduleName}.service';
import { buildCreate${modelName}Input, build${modelName} } from '../factories/${moduleName}.factory';
import { revalidatePath } from 'next/cache';

vi.mock('../../services/${moduleName}.service', () => ({
  ${moduleName}Service: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),${manifest.endpoints.some(e => e.method === 'DELETE' && e.path === manifest.basePath) ? `
    deleteAll: vi.fn(),` : ''}${manifest.endpoints.some(e => e.method === 'GET' && e.path === manifest.basePath + '/summary') ? `
    getSummary: vi.fn(),` : ''}
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('${modelName} Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create${modelName}Action', () => {
    it('should create ${modelName} and revalidate tag', async () => {
      const input = buildCreate${modelName}Input();
      const mockData = build${modelName}();
      vi.mocked(${moduleName}Service.create).mockResolvedValue(mockData);

      const result = await actions.create${modelName}Action(input);

      expect(${moduleName}Service.create).toHaveBeenCalledWith(input);
      expect(revalidatePath).toHaveBeenCalledWith('/${moduleName}');
      expect(result).toEqual(mockData);
    });

    it('should throw error when service fails', async () => {
      const input = buildCreate${modelName}Input();
      vi.mocked(${moduleName}Service.create).mockRejectedValue(new Error('Service Error'));

      await expect(actions.create${modelName}Action(input)).rejects.toThrow('Service Error');
    });
  });

  describe('get${modelName}sAction', () => {
    it('should return list of ${modelName}s', async () => {
      const mockData = [build${modelName}()];
      vi.mocked(${moduleName}Service.getAll).mockResolvedValue(mockData);

      const result = await actions.get${modelName}sAction();

      expect(${moduleName}Service.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });${manifest.endpoints.some(e => e.method === 'DELETE' && e.path === manifest.basePath) ? `

  describe('deleteAll${modelName}sAction', () => {
    it('should delete all and revalidate', async () => {
      vi.mocked(${moduleName}Service.deleteAll).mockResolvedValue();

      await actions.deleteAll${modelName}sAction();

      expect(${moduleName}Service.deleteAll).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/${moduleName}');
    });
  });` : ''}${manifest.endpoints.some(e => e.method === 'GET' && e.path === manifest.basePath + '/summary') ? `

  describe('get${modelName}sSummaryAction', () => {
    it('should return summary', async () => {
      const mockSummary = { total: 10 };
      vi.mocked(${moduleName}Service.getSummary).mockResolvedValue(mockSummary);

      const result = await actions.get${modelName}sSummaryAction();

      expect(${moduleName}Service.getSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });` : ''}
});
`.trim();
}
