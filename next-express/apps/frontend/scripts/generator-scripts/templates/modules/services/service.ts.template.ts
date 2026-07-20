import { Manifest } from '../../../generate-modules';

export function generateServiceTemplate(manifest: Manifest): string {
  const { moduleName, modelName } = manifest;

  return `
import { ${moduleName}Api } from './${moduleName}.api';
import { ${modelName}, Create${modelName}Input, Update${modelName}Input } from '../types/${moduleName}.types';

export const ${moduleName}Service = {
  async getAll(params?: Record<string, any>): Promise<${modelName}[]> {
    const response = await ${moduleName}Api.getAll(params);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch ${modelName}s');
    }
    return response.data;
  },

  async getById(id: string): Promise<${modelName}> {
    const response = await ${moduleName}Api.getById(id);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch ${modelName}');
    }
    return response.data;
  },

  async create(data: Create${modelName}Input): Promise<${modelName}> {
    const response = await ${moduleName}Api.create(data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create ${modelName}');
    }
    return response.data;
  },

  async update(id: string, data: Update${modelName}Input): Promise<${modelName}> {
    const response = await ${moduleName}Api.update(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update ${modelName}');
    }
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response = await ${moduleName}Api.delete(id);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete ${modelName}');
    }
  }${manifest.endpoints.some(e => e.method === 'DELETE' && e.path === manifest.basePath) ? `,

  async deleteAll(): Promise<void> {
    const response = await ${moduleName}Api.deleteAll();
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete all ${modelName}s');
    }
  }` : ''}${manifest.endpoints.some(e => e.method === 'GET' && e.path === manifest.basePath + '/summary') ? `,

  async getSummary(): Promise<{ total: number }> {
    const response = await ${moduleName}Api.getSummary();
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch ${modelName} summary');
    }
    return response.data;
  }` : ''}
};
`.trim();
}
