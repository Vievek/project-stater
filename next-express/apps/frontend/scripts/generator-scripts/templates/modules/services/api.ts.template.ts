import { Manifest } from '../../../generate-modules';

export function generateApiTemplate(manifest: Manifest): string {
  const { moduleName, modelName, basePath } = manifest;

  return `
import { BaseApiClient, ApiResponse } from "@/lib/api/base-client";
import { ${modelName}, Create${modelName}Input, Update${modelName}Input } from "../types/${moduleName}.types";

class ${modelName}ApiClient extends BaseApiClient<${modelName}> {
  constructor() {
    super("${basePath}");
  }

  async getAll(params?: Record<string, any>): Promise<ApiResponse<${modelName}[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.fetch<${modelName}[]>(\`\${query ? '?' + query : ''}\`);
  }

  async getById(id: string): Promise<ApiResponse<${modelName}>> {
    return this.fetch<${modelName}>(\`/\${id}\`);
  }

  async create(data: Create${modelName}Input): Promise<ApiResponse<${modelName}>> {
    return this.fetch<${modelName}>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Update${modelName}Input): Promise<ApiResponse<${modelName}>> {
    return this.fetch<${modelName}>(\`/\${id}\`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.fetch<void>(\`/\${id}\`, {
      method: "DELETE",
    });
  }
${manifest.endpoints.some(e => e.method === 'DELETE' && e.path === manifest.basePath) ? `
  async deleteAll(): Promise<ApiResponse<void>> {
    return this.fetch<void>("", {
      method: "DELETE",
    });
  }
` : ''}${manifest.endpoints.some(e => e.method === 'GET' && e.path === manifest.basePath + '/summary') ? `
  async getSummary(): Promise<ApiResponse<{ total: number }>> {
    return this.fetch<{ total: number }>("/summary");
  }
` : ''}
}

export const ${moduleName}Api = new ${modelName}ApiClient();
`.trim();
}
