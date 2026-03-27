import { describe, it, expect } from 'vitest';
import { parseSource } from '@guardrail-ai/core';
import rule from '../open-redirect.js';

function detect(source: string) {
  const ast = parseSource(source, 'test.ts');
  return rule.detect({ filePath: 'test.ts', source, ast });
}

describe('security/open-redirect', () => {
  it('detects res.redirect with req.query', () => {
    const v = detect(`res.redirect(req.query.url);`);
    expect(v).toHaveLength(1);
    expect(v[0].ruleId).toBe('security/open-redirect');
  });

  it('detects window.location.href assignment with user input', () => {
    const v = detect(`window.location.href = req.query.redirect;`);
    expect(v).toHaveLength(1);
  });

  it('ignores redirect with static string', () => {
    const v = detect(`res.redirect('/dashboard');`);
    expect(v).toHaveLength(0);
  });

  it('ignores redirect with numeric status only', () => {
    const v = detect(`res.redirect(301, '/new-url');`);
    expect(v).toHaveLength(0);
  });
});
