import { Project, SyntaxKind, ClassDeclaration, NewExpression, PropertyAccessExpression } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

const injectedResults: { file: string; className: string; injectedDependencies: string[] }[] = [];
const hardcodedResults: { file: string; className: string; hardcodedDependency: string; type: string }[] = [];

project.getSourceFiles().forEach(sourceFile => {
  if (
    sourceFile.getFilePath().includes('.test.') || 
    sourceFile.getFilePath().includes('node_modules') ||
    sourceFile.getFilePath().endsWith('.d.ts')
  ) return;

  sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((classNode: ClassDeclaration) => {
    const className = classNode.getName() || 'Anonymous';
    
    // 1. Find Injected Dependencies
    const constructors = classNode.getConstructors();
    constructors.forEach(constructor => {
      const params = constructor.getParameters();
      if (params.length > 0) {
        const injected = params.map(p => `${p.getName()}: ${p.getTypeNode()?.getText() || 'any'}`);
        injectedResults.push({
          file: sourceFile.getBaseName(),
          className,
          injectedDependencies: injected,
        });
      }
    });

    // 2. Find Hardcoded Dependencies (new Keyword)
    classNode.getDescendantsOfKind(SyntaxKind.NewExpression).forEach((newExpr: NewExpression) => {
      const expression = newExpr.getExpression();
      const text = expression.getText();
      // Ignore basic types and DTOs/Errors
      if (!['Error', 'Date', 'Promise', 'Map', 'Set', 'Array', 'Object', 'AppError', 'ApiResponse'].includes(text)) {
        hardcodedResults.push({
          file: sourceFile.getBaseName(),
          className,
          hardcodedDependency: text,
          type: 'new Keyword'
        });
      }
    });

    // 3. Find Hardcoded Dependencies (Static/Singleton/Service Locator)
    classNode.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((propAccess: PropertyAccessExpression) => {
      const text = propAccess.getText();
      if (
        text.includes('getInstance') || 
        text.includes('ServiceLocator') || 
        text.includes('.shared') || 
        (text.includes('prisma.') && !text.includes('this.db'))
      ) {
        // Simple filter to avoid too much noise, just examples
        hardcodedResults.push({
          file: sourceFile.getBaseName(),
          className,
          hardcodedDependency: text,
          type: 'Static/Singleton/ServiceLocator'
        });
      }
    });
  });
});

const uniqueHardcoded = Array.from(new Set(hardcodedResults.map(r => JSON.stringify(r)))).map(s => JSON.parse(s));

if (uniqueHardcoded.length > 0) {
  console.log("\nHardcoded Dependencies Found (Potential DI Violations):");
  console.table(uniqueHardcoded);
} else {
  console.log("\nNo Hardcoded Dependencies found.");
}
