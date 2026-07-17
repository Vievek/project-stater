import { Project, SyntaxKind, ClassDeclaration, MethodDeclaration } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

const results: any[] = [];

project.getSourceFiles().forEach(sourceFile => {
  if (sourceFile.getFilePath().includes('.test.') || 
      sourceFile.getFilePath().includes('node_modules') ||
      sourceFile.getFilePath().endsWith('.d.ts')) return;

  sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((classNode: ClassDeclaration) => {
    const baseClass = classNode.getBaseClass();
    if (baseClass) {
      const className = classNode.getName() || 'Anonymous';
      classNode.getMethods().forEach((method: MethodDeclaration) => {
        const statements = method.getStatements();
        const throwsNotImplemented = statements.some(s => s.getText().includes('throw new Error') && s.getText().toLowerCase().includes('not implemented'));
        if (throwsNotImplemented) {
          results.push({
            file: sourceFile.getBaseName(),
            className,
            method: method.getName(),
            violation: 'Throws NotImplementedError (LSP violation)',
          });
        }
      });
    }
  });
});

if (results.length > 0) {
  console.log("LSP Violations Found:");
  console.table(results);
} else {
  console.log("No LSP Violations found.");
}
