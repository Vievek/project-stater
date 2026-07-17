import { Project } from 'ts-morph';
import { getLoopDepth, getBigO, runComplexityCheck } from '../analytics_scripts/check-complexity';

describe('check-complexity script', () => {
  it('should correctly convert loop depth to Big O notation', () => {
    expect(getBigO(0)).toBe('O(1)');
    expect(getBigO(1)).toBe('O(N)');
    expect(getBigO(2)).toBe('O(N^2)');
    expect(getBigO(3)).toBe('O(N^3)');
    expect(getBigO(4)).toBe('O(N^4)');
  });

  describe('runComplexityCheck', () => {
    let project: Project;

    beforeEach(() => {
      project = new Project({ useInMemoryFileSystem: true });
    });

    it('should identify O(1) complexity', () => {
      project.createSourceFile('test1.ts', `
        function constantTime() {
          console.log('hello');
          return 1 + 1;
        }
      `);
      
      const results = runComplexityCheck(project);
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ functionName: 'constantTime', bigO: 'O(1)' });
    });

    it('should identify O(N) complexity with loops and array methods', () => {
      project.createSourceFile('test2.ts', `
        function linearTime(arr: number[]) {
          for (let i = 0; i < arr.length; i++) {}
        }
        function mapTime(arr: number[]) {
          arr.map(x => x * 2);
        }
      `);
      
      const results = runComplexityCheck(project);
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({ functionName: 'linearTime', bigO: 'O(N)' });
      expect(results[1]).toMatchObject({ functionName: 'mapTime', bigO: 'O(N)' });
    });

    it('should identify O(N^2) complexity with nested loops', () => {
      project.createSourceFile('test3.ts', `
        function quadraticTime(arr: number[]) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {}
          }
        }
        function mixedQuadratic(arr: number[]) {
          arr.forEach(item => {
            for(let x of arr) {}
          });
        }
      `);
      
      const results = runComplexityCheck(project);
      expect(results).toHaveLength(4); // includes the arrow functions passed to forEach
      
      const quad = results.find(r => r.functionName === 'quadraticTime');
      expect(quad?.bigO).toBe('O(N^2)');
      
      const mixed = results.find(r => r.functionName === 'mixedQuadratic');
      expect(mixed?.bigO).toBe('O(N^2)');
    });
  });
});
