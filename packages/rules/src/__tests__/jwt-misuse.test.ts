import { describe, it, expect } from 'vitest';
import { parseSource } from '@guardrail-ai/core';
import rule from '../jwt-misuse.js';

function detect(source: string) {
  const ast = parseSource(source, 'test.ts');
  return rule.detect({ filePath: 'test.ts', source, ast });
}

describe('security/jwt-misuse', () => {
  it('detects jwt.decode() usage', () => {
    const v = detect(`const data = jwt.decode(token);`);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('high');
    expect(v[0].message).toContain('does NOT verify');
  });

  it('detects jwt.sign with empty secret', () => {
    const v = detect(`jwt.sign(payload, '');`);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('critical');
  });

  it('detects jwt.sign with hardcoded secret', () => {
    const v = detect(`jwt.sign(payload, 'my-super-secret');`);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('high');
  });

  it('detects algorithm none', () => {
    const v = detect(`jwt.verify(token, secret, { algorithms: ['none'] });`);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('critical');
    expect(v[0].message).toContain('algorithm "none"');
  });

  it('allows jwt.verify with env var secret', () => {
    const v = detect(`jwt.verify(token, process.env.JWT_SECRET);`);
    expect(v).toHaveLength(0);
  });

  it('ignores TextDecoder.decode() — not JWT', () => {
    const v = detect(`const text = decoder.decode(value, { stream: true });`);
    expect(v).toHaveLength(0);
  });

  it('ignores response.decode() — not JWT', () => {
    const v = detect(`const data = response.decode();`);
    expect(v).toHaveLength(0);
  });
});
