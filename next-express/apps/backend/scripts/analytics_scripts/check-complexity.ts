import { Project, Node, SyntaxKind, FunctionDeclaration, MethodDeclaration, ArrowFunction, FunctionExpression } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
});

type FuncNode = FunctionDeclaration | MethodDeclaration | ArrowFunction | FunctionExpression;

export function getLoopDepth(node: Node): number {
  let maxDepth = 0;
  const loopKinds = [
    SyntaxKind.ForStatement,
    SyntaxKind.ForInStatement,
    SyntaxKind.ForOfStatement,
    SyntaxKind.WhileStatement,
    SyntaxKind.DoStatement
  ];

  node.forEachChild(child => {
    let currentDepth = getLoopDepth(child);
    if (loopKinds.includes(child.getKind())) {
      currentDepth += 1;
    }
    // Also consider Array.prototype.map/forEach etc as O(N)
    if (child.getKind() === SyntaxKind.CallExpression) {
      const text = child.getText();
      if (text.includes('.map(') || text.includes('.forEach(') || text.includes('.filter(') || text.includes('.reduce(')) {
        currentDepth += 1;
      }
    }
    if (currentDepth > maxDepth) {
      maxDepth = currentDepth;
    }
  });
  return maxDepth;
}

export function getBigO(depth: number): string {
  if (depth === 0) return 'O(1)';
  if (depth === 1) return 'O(N)';
  if (depth === 2) return 'O(N^2)';
  if (depth === 3) return 'O(N^3)';
  return `O(N^${depth})`;
}

export function runComplexityCheck(project: Project) {
  const results: { file: string; functionName: string; bigO: string }[] = [];

  project.getSourceFiles().forEach(sourceFile => {
    if (
      sourceFile.getFilePath().includes('.test.') || 
      sourceFile.getFilePath().includes('node_modules') ||
      sourceFile.getFilePath().endsWith('.d.ts')
    ) return;

    const analyzeFunction = (func: FuncNode) => {
      let name = 'anonymous';
      if (Node.isFunctionDeclaration(func) || Node.isMethodDeclaration(func)) {
        name = func.getName() || 'anonymous';
      } else {
        const parent = func.getParent();
        if (Node.isVariableDeclaration(parent) || Node.isPropertyDeclaration(parent) || Node.isPropertyAssignment(parent)) {
          name = (parent as any).getName();
        } else if (Node.isCallExpression(parent)) {
          // e.g., passed as a callback
          const expr = parent.getExpression();
          name = `callback in ${expr.getText()}`;
        }
      }
      
      const depth = getLoopDepth(func);
      results.push({
        file: sourceFile.getBaseName(),
        functionName: name,
        bigO: getBigO(depth),
      });
    };

    sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach(analyzeFunction);
    sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(analyzeFunction);
    sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction).forEach(analyzeFunction);
    sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression).forEach(analyzeFunction);
  });

  return results;
}

if (require.main === module) {
  const project = new Project({
    tsConfigFilePath: path.join(__dirname, '../../tsconfig.json'),
  });
  console.table(runComplexityCheck(project));
}
