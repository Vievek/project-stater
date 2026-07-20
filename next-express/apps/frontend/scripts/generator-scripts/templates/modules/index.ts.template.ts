import { Manifest } from '../../generate-modules';

export function generateIndexTemplate(manifest: Manifest): string {
  const { moduleName, modelName } = manifest;

  return `
export * from "./types/${moduleName}.types";
export * from "./types/${moduleName}.zod";
export * from "./services/${moduleName}.api";
export * from "./services/${moduleName}.service";
export * from "./actions/${moduleName}.actions";
export * from "./components/${modelName}Form";
export * from "./components/${modelName}Table";
`.trim();
}
