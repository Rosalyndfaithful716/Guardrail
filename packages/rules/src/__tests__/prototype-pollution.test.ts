import { describe, it, expect } from 'vitest';
import { parseSource } from '@guardrail-ai/core';
import rule from '../prototype-pollution.js';

function detect(source: string) {
  const ast = parseSource(source, 'test.ts');
  return rule.detect({ filePath: 'test.ts', source, ast });
}

describe('security/prototype-pollution', () => {
  it('detects nested dynamic property assignment', () => {
    const v = detect(`obj[a][b] = value;`);
    expect(v).toHaveLength(1);
    expect(v[0].ruleId).toBe('security/prototype-pollution');
  });

  it('detects Object.assign with non-literal target', () => {
    const v = detect(`Object.assign(target, userInput);`);
    expect(v).toHaveLength(1);
  });

  it('detects _.merge calls', () => {
    const v = detect(`_.merge(config, req.body);`);
    expect(v).toHaveLength(1);
  });

  it('detects _.defaultsDeep calls', () => {
    const v = detect(`_.defaultsDeep(options, defaults);`);
    expect(v).toHaveLength(1);
  });

  it('allows Object.assign with literal target', () => {
    const v = detect(`Object.assign({}, source);`);
    expect(v).toHaveLength(0);
  });
});
