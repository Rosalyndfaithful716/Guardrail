import { describe, it, expect } from 'vitest';
import { parseSource } from '../parser.js';

describe('parseSource', () => {
  it('parses JavaScript', () => {
    const ast = parseSource('const x = 1;', 'test.js');
    expect(ast.type).toBe('File');
    expect(ast.program.body.length).toBe(1);
  });

  it('parses TypeScript', () => {
    const ast = parseSource('const x: number = 1;', 'test.ts');
    expect(ast.program.body.length).toBe(1);
  });

  it('parses JSX', () => {
    const ast = parseSource('const el = <div>hello</div>;', 'test.jsx');
    expect(ast.program.body.length).toBe(1);
  });

  it('parses TSX', () => {
    const ast = parseSource('const el: JSX.Element = <div />;', 'test.tsx');
    expect(ast.program.body.length).toBe(1);
  });

  it('parses decorators', () => {
    const ast = parseSource('@decorator\nclass Foo {}', 'test.ts');
    expect(ast.type).toBe('File');
  });

  it('parses async/await', () => {
    const ast = parseSource('async function f() { await fetch("x"); }', 'test.js');
    expect(ast.program.body.length).toBe(1);
  });

  it('parses optional chaining', () => {
    const ast = parseSource('const x = a?.b?.c;', 'test.js');
    expect(ast.program.body.length).toBe(1);
  });
});
