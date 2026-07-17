/**
 * sync_m2m_methods.ts
 *
 * Scans the schema for many-to-many relationships and generates
 * set/connect/disconnect methods on the corresponding repositories.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaSchemaProvider, ModelInfo } from './schema_parser';

const PRISMA_SCHEMA_PATH = path.join(__dirname, '../../prisma/schema.prisma');
const MODULES_DIR        = path.join(__dirname, '../../src/modules');

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function camelCase(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const START_MARKER = `// --- AUTO-GENERATED M2M METHODS (sync_m2m_methods.ts) — DO NOT EDIT BELOW THIS LINE ---`;
const END_MARKER   = `// --- END AUTO-GENERATED M2M METHODS ---`;

async function main() {
  const provider = new PrismaSchemaProvider(PRISMA_SCHEMA_PATH);
  const models   = await provider.getModels();

  for (const model of models) {
    const modelNameLower = camelCase(model.name);
    const repoPath       = path.join(MODULES_DIR, modelNameLower, `${modelNameLower}.repository.ts`);

    if (!fs.existsSync(repoPath)) {
      continue; // only touch modules whose folder already exists on disk
    }

    // Identify M2M fields: list relation where the related model does NOT hold a FK pointing back to us.
    const m2mFields = model.fields.filter(f => {
      if (!f.isRelation || !f.isList) return false;
      
      const relatedModel = models.find(m => m.name === f.relatedModel);
      if (!relatedModel) return false;

      // Check if related model has a FK pointing to us
      const relatedHasFkToUs = relatedModel.fields.some(
        rf => rf.isForeignKey && rf.relatedModel === model.name
      );

      return !relatedHasFkToUs;
    });

    let content = fs.readFileSync(repoPath, 'utf8');

    // Remove existing block if present
    const startIndex = content.indexOf(START_MARKER);
    const endIndex = content.indexOf(END_MARKER);
    
    if (startIndex !== -1 && endIndex !== -1) {
      content = content.slice(0, startIndex) + content.slice(endIndex + END_MARKER.length);
    } else if (startIndex !== -1) {
       // Malformed block, just remove from start to end of file (minus closing brace)
       // This is a naive fallback
    }

    content = content.trimEnd();
    if (content.endsWith('}')) {
      content = content.slice(0, -1).trimEnd();
    }

    if (m2mFields.length > 0) {
      let methodsBlock = `\n\n  ${START_MARKER}\n`;
      for (const field of m2mFields) {
        const Name = capitalize(field.name);
        const fieldName = field.name;
        
        methodsBlock += `  async set${Name}(id: string, relatedIds: string[]): Promise<${model.name}> {\n`;
        methodsBlock += `    if (!this.relations) throw new Error('Relation adapter not configured for this repository');\n`;
        methodsBlock += `    return this.relations.setRelation(id, '${fieldName}', relatedIds);\n`;
        methodsBlock += `  }\n\n`;

        methodsBlock += `  async connect${Name}(id: string, relatedIds: string[]): Promise<${model.name}> {\n`;
        methodsBlock += `    if (!this.relations) throw new Error('Relation adapter not configured for this repository');\n`;
        methodsBlock += `    return this.relations.connectRelation(id, '${fieldName}', relatedIds);\n`;
        methodsBlock += `  }\n\n`;

        methodsBlock += `  async disconnect${Name}(id: string, relatedIds: string[]): Promise<${model.name}> {\n`;
        methodsBlock += `    if (!this.relations) throw new Error('Relation adapter not configured for this repository');\n`;
        methodsBlock += `    return this.relations.disconnectRelation(id, '${fieldName}', relatedIds);\n`;
        methodsBlock += `  }\n`;
      }
      methodsBlock += `  ${END_MARKER}\n`;
      content += methodsBlock;
    } else {
      content += '\n'; // just add back some newline
    }

    content += '}\n';
    fs.writeFileSync(repoPath, content, 'utf8');
    console.log(`Synced M2M methods for ${model.name}`);
  }
}

main().catch(console.error);
