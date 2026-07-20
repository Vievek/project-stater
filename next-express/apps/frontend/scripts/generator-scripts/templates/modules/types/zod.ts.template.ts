import { Manifest, Endpoint } from '../../../generate-modules';

export function generateZodTemplate(manifest: Manifest): string {
  const { modelName, endpoints } = manifest;

  const createEndpoint = endpoints.find((e: Endpoint) => e.method === 'POST');
  const updateEndpoint = endpoints.find((e: Endpoint) => e.method === 'PUT' && e.path.includes(':id'));

  const generateSchemaFields = (body?: Record<string, { zod: string; required: boolean }>) => {
    if (!body) return '';
    return Object.entries(body).map(([key, value]) => {
      return `  ${key}: ${value.zod},`;
    }).join('\n');
  };

  return `
import { z } from 'zod';

export const create${modelName}Schema = z.object({
${generateSchemaFields(createEndpoint?.requestBody)}
});

export const update${modelName}Schema = z.object({
${generateSchemaFields(updateEndpoint?.requestBody)}
});

export type Create${modelName}SchemaType = z.infer<typeof create${modelName}Schema>;
export type Update${modelName}SchemaType = z.infer<typeof update${modelName}Schema>;
`.trim();
}
