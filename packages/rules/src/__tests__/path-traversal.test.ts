import { describe, it, expect } from 'vitest';
import { parseSource } from '@guardrail-ai/core';
import rule from '../path-traversal.js';

function detect(source: string) {
  const ast = parseSource(source, 'test.ts');
  return rule.detect({ filePath: 'test.ts', source, ast });
}

describe('security/path-traversal', () => {
  it('detects fs.readFile with req.params', () => {
    const v = detect(`fs.readFile(req.params.filename, 'utf-8', cb);`);
    expect(v).toHaveLength(1);
    expect(v[0].ruleId).toBe('security/path-traversal');
    expect(v[0].severity).toBe('critical');
  });

  it('detects fs.readFileSync with request body', () => {
    const v = detect(`const data = fs.readFileSync(request.body.path);`);
    expect(v).toHaveLength(1);
  });

  it('detects path.join with user input', () => {
    const v = detect(`const file = path.join(uploadDir, req.query.name);`);
    expect(v).toHaveLength(1);
    expect(v[0].severity).toBe('high');
  });

  it('ignores static file paths', () => {
    const v = detect(`fs.readFile('./config.json', 'utf-8', cb);`);
    expect(v).toHaveLength(0);
  });

  it('ignores fs calls with variable not from request', () => {
    const v = detect(`fs.readFile(localPath, 'utf-8', cb);`);
    expect(v).toHaveLength(0);
  });
});
