import { Manifest } from '../../../../generate-modules';

export function generateServiceTestTemplate(manifest: Manifest): string {
  const { moduleName, modelName } = manifest;

  return `
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ${moduleName}Service } from '../../services/${moduleName}.service';
import { ${moduleName}Api } from '../../services/${moduleName}.api';
import { buildCreate${modelName}Input, build${modelName} } from '../factories/${moduleName}.factory';

vi.mock('../../services/${moduleName}.api', () => ({
  ${moduleName}Api: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('${modelName}Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should return data on successful creation', async () => {
      const input = buildCreate${modelName}Input();
      const mockResponse = build${modelName}();
      vi.mocked(${moduleName}Api.create).mockResolvedValue({ success: true, data: mockResponse });

      const result = await ${moduleName}Service.create(input);

      expect(${moduleName}Api.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });

    it.each([
      ['Validation Error', { message: 'Invalid payload' }],
      ['Server Error', undefined],
    ])('should throw error when api create fails (%s)', async (_, errorData) => {
      const input = buildCreate${modelName}Input();
      vi.mocked(${moduleName}Api.create).mockResolvedValue({ 
        success: false, 
        error: errorData as any 
      } as any);

      await expect(${moduleName}Service.create(input)).rejects.toThrow(
        errorData?.message || 'Failed to create ${modelName}'
      );
    });
  });

  describe('getAll', () => {
    it('should return list of ${modelName}s', async () => {
      const mockResponse = [build${modelName}()];
      vi.mocked(${moduleName}Api.getAll).mockResolvedValue({ success: true, data: mockResponse });

      const result = await ${moduleName}Service.getAll();

      expect(${moduleName}Api.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});
`.trim();
}
