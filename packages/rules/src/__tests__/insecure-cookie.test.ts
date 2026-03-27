import { describe, it, expect } from 'vitest';
import { parseSource } from '@guardrail-ai/core';
import rule from '../insecure-cookie.js';

function detect(source: string) {
  const ast = parseSource(source, 'test.ts');
  return rule.detect({ filePath: 'test.ts', source, ast });
}

describe('security/insecure-cookie', () => {
  it('detects session cookie without options', () => {
    const v = detect(`res.cookie('session', token);`);
    expect(v).toHaveLength(1);
    expect(v[0].ruleId).toBe('security/insecure-cookie');
  });

  it('detects auth cookie with httpOnly false', () => {
    const v = detect(`res.cookie('auth', token, { httpOnly: false, secure: true });`);
    expect(v).toHaveLength(1);
  });

  it('detects document.cookie assignment', () => {
    const v = detect(`document.cookie = 'session=' + token;`);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('warning');
  });

  it('ignores non-sensitive cookie names', () => {
    const v = detect(`res.cookie('theme', 'dark');`);
    expect(v).toHaveLength(0);
  });

  it('detects cookie missing sameSite', () => {
    const v = detect(`res.cookie('session', token, { httpOnly: true, secure: true });`);
    expect(v).toHaveLength(1);
  });
});
