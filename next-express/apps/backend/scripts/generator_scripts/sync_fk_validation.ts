/**
 * sync_fk_validation.ts
 *
 * Scans the schema for foreign keys and adds validation to the corresponding
 * generated services and modules.
 *
 * For each model with a FK (e.g., Todo has categoryId):
 * - Modifies the Module to instantiate the related repository and pass it.
 * - Modifies the Service constructor to accept the related repositories.
 * - Overrides create() and update() in the Service to perform FK checks.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind, Scope } from 'ts-morph';
import { PrismaSchemaProvider } from './schema_parser';

const PRISMA_SCHEMA_PATH = path.join(__dirname, '../../prisma/schema.prisma');
const MODULES_DIR        = path.join(__dirname, '../../src/modules');

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function camelCase(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

async function main() {
  const provider = new PrismaSchemaProvider(PRISMA_SCHEMA_PATH);
  const models = await provider.getModels();
  
  const project = new Project();
  project.addSourceFilesAtPaths(`${MODULES_DIR}/**/*.ts`);

  for (const model of models) {
    const modelNameLower = camelCase(model.name);
    const moduleDir = path.join(MODULES_DIR, modelNameLower);
    
    if (!fs.existsSync(moduleDir)) {
      continue;
    }

    const fkFields = model.fields.filter(f => f.isForeignKey && f.relatedModel);
    if (fkFields.length === 0) continue;

    console.log(`Processing FK validation for ${model.name}...`);

    const servicePath = path.join(moduleDir, `${modelNameLower}.service.ts`);
    const modulePath = path.join(moduleDir, `${modelNameLower}.module.ts`);

    if (!fs.existsSync(servicePath) || !fs.existsSync(modulePath)) {
      continue;
    }

    const serviceFile = project.getSourceFile(servicePath);
    const moduleFile = project.getSourceFile(modulePath);

    if (!serviceFile || !moduleFile) {
        console.warn(`Could not load TS morph file for ${model.name}`);
        continue;
    }

    const serviceClass = serviceFile.getClass(`${model.name}Service`);
    if (!serviceClass) continue;

    const constructor = serviceClass.getConstructors()[0];
    if (!constructor) continue;

    const addedRepos = new Set<string>();

    for (const fkField of fkFields) {
      const relatedModelCap = capitalize(fkField.relatedModel!);
      const relatedModelCamel = camelCase(fkField.relatedModel!);
      const repoParamName = `${relatedModelCamel}Repository`;
      const repoClassName = `${relatedModelCap}Repository`;

      // 1. Add Import for related repository in Service
      const hasRepoImport = serviceFile.getImportDeclarations().some(
        imp => imp.getNamedImports().some(n => n.getName() === repoClassName)
      );

      if (!hasRepoImport) {
        serviceFile.addImportDeclaration({
          namedImports: [repoClassName],
          moduleSpecifier: `../${relatedModelCamel}/${relatedModelCamel}.repository`
        });
      }

      // 2. Add to Service Constructor
      const hasParam = constructor.getParameters().some(p => p.getName() === repoParamName);
      if (!hasParam) {
        const firstOptionalIndex = constructor.getParameters().findIndex(p => p.isOptional());
        const insertIndex = firstOptionalIndex === -1 ? constructor.getParameters().length : firstOptionalIndex;
        constructor.insertParameter(insertIndex, {
          name: repoParamName,
          type: repoClassName,
          scope: Scope.Private,
          isReadonly: true,
        });
        addedRepos.add(repoParamName);
      }
      
      // 3. Add Import for related repository in Module
      const hasModuleRepoImport = moduleFile.getImportDeclarations().some(
        imp => imp.getNamedImports().some(n => n.getName() === repoClassName)
      );
      if (!hasModuleRepoImport) {
         moduleFile.addImportDeclaration({
          namedImports: [repoClassName],
          moduleSpecifier: `../${relatedModelCamel}/${relatedModelCamel}.repository`
        });
      }
      
      // 4. Instantiate related Repo in Module Factory
      const moduleFactory = moduleFile.getFunction(`create${model.name}Module`);
      if (moduleFactory) {
         const statements = moduleFactory.getBody()?.getChildrenOfKind(SyntaxKind.SyntaxList)[0]?.getChildrenOfKind(SyntaxKind.VariableStatement) || [];
         const hasInstantiation = statements.some(s => s.getText().includes(`new ${repoClassName}`));
         if (!hasInstantiation) {
             moduleFactory.insertStatements(0, `const ${repoParamName} = new ${repoClassName}(deps.db.${relatedModelCamel}, deps.cacheService);`);
         }
         
         // 5. Inject into Service instantiation in Module
         const serviceInstantiations = moduleFactory.getVariableDeclarations().filter(d => d.getName() === 'service' || d.getInitializer()?.getText().includes(`new ${model.name}Service`));
         if (serviceInstantiations.length > 0) {
             const serviceInit = serviceInstantiations[0].getInitializerIfKind(SyntaxKind.NewExpression);
             if (serviceInit) {
                 const currentArgs = serviceInit.getArguments().map(a => a.getText());
                 if (!currentArgs.includes(repoParamName)) {
                     serviceInit.addArgument(repoParamName);
                 }
             }
         }
      }
    }

    // 6. Override create and update in Service
    let createMethod = serviceClass.getMethod('create');
    if (!createMethod) {
       createMethod = serviceClass.addMethod({
           name: 'create',
           isAsync: true,
           parameters: [{ name: 'data', type: 'any' }],
           returnType: `Promise<${model.name}>`,
       });
       
       let statements = ``;
       for (const fkField of fkFields) {
           const relatedModelCamel = camelCase(fkField.relatedModel!);
           const repoParamName = `${relatedModelCamel}Repository`;
           statements += `
    if (data.${fkField.name}) {
        const relatedRecord = await this.${repoParamName}.findById(data.${fkField.name});
        if (!relatedRecord) {
            throw new Error("${fkField.relatedModel} not found");
        }
    }
`;
       }
       statements += `    return super.create(data);`;
       createMethod.setBodyText(statements);
    } else {
        if (!createMethod.getText().includes('findById')) {
            let statements = ``;
            for (const fkField of fkFields) {
               const relatedModelCamel = camelCase(fkField.relatedModel!);
               const repoParamName = `${relatedModelCamel}Repository`;
               statements += `
    if (data.${fkField.name}) {
        const relatedRecord = await this.${repoParamName}.findById(data.${fkField.name});
        if (!relatedRecord) {
            throw new Error("${fkField.relatedModel} not found");
        }
    }
`;
            }
            statements += createMethod.getBodyText() || `return super.create(data);`;
            createMethod.setBodyText(statements);
        }
    }
    
    let updateMethod = serviceClass.getMethod('update');
    if (!updateMethod) {
       updateMethod = serviceClass.addMethod({
           name: 'update',
           isAsync: true,
           parameters: [{ name: 'id', type: 'string' }, { name: 'data', type: 'any' }, { name: 'notFoundMessage', type: 'string', hasQuestionToken: true }],
           returnType: `Promise<${model.name}>`,
       });
       
       let statements = ``;
       for (const fkField of fkFields) {
           const relatedModelCamel = camelCase(fkField.relatedModel!);
           const repoParamName = `${relatedModelCamel}Repository`;
           statements += `
    if (data.${fkField.name}) {
        const relatedRecord = await this.${repoParamName}.findById(data.${fkField.name});
        if (!relatedRecord) {
            throw new Error("${fkField.relatedModel} not found");
        }
    }
`;
       }
       statements += `    return super.update(id, data, notFoundMessage);`;
       updateMethod.setBodyText(statements);
    } else {
        if (!updateMethod.getText().includes('findById')) {
            let statements = ``;
            for (const fkField of fkFields) {
               const relatedModelCamel = camelCase(fkField.relatedModel!);
               const repoParamName = `${relatedModelCamel}Repository`;
               statements += `
    if (data.${fkField.name}) {
        const relatedRecord = await this.${repoParamName}.findById(data.${fkField.name});
        if (!relatedRecord) {
            throw new Error("${fkField.relatedModel} not found");
        }
    }
`;
            }
            statements += updateMethod.getBodyText() || `return super.update(id, data, notFoundMessage);`;
            updateMethod.setBodyText(statements);
        }
    }

    // Since we also import Model type in service for returnType, let's make sure it's imported
    const hasModelImport = serviceFile.getImportDeclarations().some(
        imp => imp.getNamedImports().some(n => n.getName() === model.name)
    );
    if (!hasModelImport) {
        serviceFile.addImportDeclaration({
            namedImports: [model.name],
            moduleSpecifier: `./${modelNameLower}.types`
        });
    }

    console.log(`Successfully patched ${model.name}Service and ${model.name}Module`);
  }

  await project.save();
  console.log('Done syncing FK validations.');
}

main().catch(console.error);
