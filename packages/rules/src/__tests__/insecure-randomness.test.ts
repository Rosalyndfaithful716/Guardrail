import { describe, it, expect } from 'vitest';
import { parseSource } from '@guardrail-ai/core';
import rule from '../insecure-randomness.js';

function detect(source: string) {
  const ast = parseSource(source, 'test.ts');
  return rule.detect({ filePath: 'test.ts', source, ast });
}

describe('security/insecure-randomness', () => {
  it('detects Math.random() in security-sensitive context', () => {
    const v = detect(`const token = Math.random().toString(36);`);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('high');
  });

  it('detects Math.random() assigned to password variable', () => {
    const v = detect(`const password = Math.random().toString(36).slice(2);`);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('high');
  });

  it('ignores Math.random() in non-sensitive context', () => {
    const v = detect(`const x = Math.random();`);
    expect(v).toHaveLength(0);
  });

  it('ignores Math.random() for UI/animation usage', () => {
    const v = detect(`const color = Math.random() * 255;`);
    expect(v).toHaveLength(0);
  });
});
