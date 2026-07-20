import { Manifest } from '../../../generate-modules';

export function generateActionsTemplate(manifest: Manifest): string {
  const { moduleName, modelName } = manifest;

  return `
"use server";

import { revalidatePath } from "next/cache";
import { ${moduleName}Service } from "../services/${moduleName}.service";
import { Create${modelName}Input, Update${modelName}Input } from "../types/${moduleName}.types";

export async function get${modelName}sAction(params?: Record<string, any>) {
  try {
    return await ${moduleName}Service.getAll(params);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch ${modelName}s");
  }
}

export async function get${modelName}ByIdAction(id: string) {
  try {
    return await ${moduleName}Service.getById(id);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch ${modelName}");
  }
}

export async function create${modelName}Action(data: Create${modelName}Input) {
  try {
    const result = await ${moduleName}Service.create(data);
    revalidatePath('/${moduleName}');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create ${modelName}");
  }
}

export async function update${modelName}Action(id: string, data: Update${modelName}Input) {
  try {
    const result = await ${moduleName}Service.update(id, data);
    revalidatePath('/${moduleName}');
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update ${modelName}");
  }
}

export async function delete${modelName}Action(id: string) {
  try {
    await ${moduleName}Service.delete(id);
    revalidatePath('/${moduleName}');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete ${modelName}");
  }
}${manifest.endpoints.some(e => e.method === 'DELETE' && e.path === manifest.basePath) ? `

export async function deleteAll${modelName}sAction() {
  try {
    await ${moduleName}Service.deleteAll();
    revalidatePath('/${moduleName}');
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete all ${modelName}s");
  }
}` : ''}${manifest.endpoints.some(e => e.method === 'GET' && e.path === manifest.basePath + '/summary') ? `

export async function get${modelName}sSummaryAction() {
  try {
    return await ${moduleName}Service.getSummary();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch ${modelName} summary");
  }
}` : ''}
`.trim();
}
