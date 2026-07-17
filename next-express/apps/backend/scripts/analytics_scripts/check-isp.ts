import { Project, SyntaxKind, InterfaceDeclaration } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

const results: any[] = [];
const MAX_INTERFACE_MEMBERS = 8;

project.getSourceFiles().forEach(sourceFile => {
  if (sourceFile.getFilePath().includes('.test.') || 
      sourceFile.getFilePath().includes('node_modules') ||
      sourceFile.getFilePath().endsWith('.d.ts')) return;

  sourceFile.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).forEach((interfaceNode: InterfaceDeclaration) => {
    const name = interfaceNode.getName();
    const membersCount = interfaceNode.getMembers().length;
    
    if (membersCount > MAX_INTERFACE_MEMBERS) {
      results.push({
        file: sourceFile.getBaseName(),
        interfaceName: name,
        membersCount,
        violation: 'Too many interface members (ISP violation)',
      });
    }
  });
});

if (results.length > 0) {
  console.log("ISP Violations Found:");
  console.table(results);
} else {
  console.log("No ISP Violations found.");
}
