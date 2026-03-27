import { describe, it, expect } from 'vitest';
import { parseSource } from '@guardrail-ai/core';
import rule from '../no-async-without-await.js';

function detect(source: string) {
  const ast = parseSource(source, 'test.ts');
  return rule.detect({ filePath: 'test.ts', source, ast });
}

describe('ai-codegen/no-async-without-await', () => {
  it('detects async function without await', () => {
    const v = detect(`
      async function getData() {
        return cache[key];
      }
    `);
    expect(v).toHaveLength(1);
    expect(v[0].ruleId).toBe('ai-codegen/no-async-without-await');
    expect(v[0].message).toContain('getData');
  });

  it('detects async arrow function without await', () => {
    const v = detect(`const fn = async () => { return 42; };`);
    expect(v).toHaveLength(1);
  });

  it('ignores async function with await', () => {
    const v = detect(`
      async function fetchData() {
        const res = await fetch('/api');
        return res.json();
      }
    `);
    expect(v).toHaveLength(0);
  });

  it('ignores async function with for-await', () => {
    const v = detect(`
      async function readAll() {
        for await (const chunk of stream) {
          process(chunk);
        }
      }
    `);
    expect(v).toHaveLength(0);
  });

  it('does not count await in nested function', () => {
    const v = detect(`
      async function outer() {
        const inner = async () => { await fetch('/api'); };
        return inner;
      }
    `);
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain('outer');
  });

  it('ignores empty async functions', () => {
    const v = detect(`async function noop() {}`);
    expect(v).toHaveLength(0);
  });
});
