import { Project, SyntaxKind, SwitchStatement, IfStatement } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

const results: any[] = [];

project.getSourceFiles().forEach(sourceFile => {
  if (sourceFile.getFilePath().includes('.test.') || 
      sourceFile.getFilePath().includes('node_modules') ||
      sourceFile.getFilePath().endsWith('.d.ts')) return;

  sourceFile.getDescendantsOfKind(SyntaxKind.SwitchStatement).forEach((node: SwitchStatement) => {
    if (node.getClauses().length > 4) {
      results.push({
        file: sourceFile.getBaseName(),
        line: node.getStartLineNumber(),
        violation: 'Large switch statement (possible OCP violation)',
      });
    }
  });

  sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement).forEach((node: IfStatement) => {
    let elseIfCount = 0;
    let current: IfStatement | undefined = node;
    while (current && current.getElseStatement() && current.getElseStatement()?.getKind() === SyntaxKind.IfStatement) {
      elseIfCount++;
      current = current.getElseStatement() as IfStatement;
    }
    if (elseIfCount >= 3) {
      results.push({
        file: sourceFile.getBaseName(),
        line: node.getStartLineNumber(),
        violation: 'Long if/else-if chain (possible OCP violation)',
      });
    }
  });
});

if (results.length > 0) {
  console.log("OCP Violations Found:");
  console.table(results);
} else {
  console.log("No OCP Violations found.");
}
