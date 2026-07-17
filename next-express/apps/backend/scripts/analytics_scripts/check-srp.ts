import { Project, SyntaxKind, ClassDeclaration } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

const MAX_METHODS = 10;
const MAX_LINES = 200;
const results: any[] = [];

project.getSourceFiles().forEach(sourceFile => {
  if (sourceFile.getFilePath().includes('.test.') || 
      sourceFile.getFilePath().includes('node_modules') ||
      sourceFile.getFilePath().endsWith('.d.ts')) return;

  sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((classNode: ClassDeclaration) => {
    const className = classNode.getName() || 'Anonymous';
    const methods = classNode.getMethods();
    const lines = classNode.getEndLineNumber() - classNode.getStartLineNumber();
    
    if (methods.length > MAX_METHODS || lines > MAX_LINES) {
      results.push({
        file: sourceFile.getBaseName(),
        className,
        methodsCount: methods.length,
        lines,
        violation: methods.length > MAX_METHODS ? 'Too many methods' : 'Too many lines',
      });
    }
  });
});

if (results.length > 0) {
  console.log("SRP Violations Found:");
  console.table(results);
} else {
  console.log("No SRP Violations found.");
}
