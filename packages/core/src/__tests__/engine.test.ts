import { describe, it, expect } from 'vitest';
import { GuardrailEngine } from '../engine.js';
import { parseSource } from '../parser.js';
import type { Rule, RuleContext } from '../types.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const testRule: Rule = {
  id: 'test/always-warn',
  name: 'Always Warn',
  description: 'Test rule',
  severity: 'warning',
  category: 'quality',
  detect(ctx: RuleContext) {
    return [{
      ruleId: 'test/always-warn',
      severity: 'warning',
      message: 'Test violation',
      location: { file: ctx.filePath, line: 1, column: 0 },
    }];
  },
};

describe('GuardrailEngine', () => {
  it('registers and retrieves rules', () => {
    const engine = new GuardrailEngine();
    engine.registerRule(testRule);
    expect(engine.getRegisteredRules()).toHaveLength(1);
    expect(engine.getRegisteredRules()[0].id).toBe('test/always-warn');
  });

  it('registers multiple rules', () => {
    const engine = new GuardrailEngine();
    engine.registerRules([testRule, { ...testRule, id: 'test/other' }]);
    expect(engine.getRegisteredRules()).toHaveLength(2);
  });

  it('scans a file and returns violations', async () => {
    const dir = join(tmpdir(), `guardrail-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'test.js');
    writeFileSync(file, 'const x = 1;');

    const engine = new GuardrailEngine();
    engine.registerRule(testRule);
    const result = await engine.scanFile(file);
    expect(result.violations).toHaveLength(1);

    rmSync(dir, { recursive: true });
  });

  it('respects severity threshold', async () => {
    const dir = join(tmpdir(), `guardrail-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'test.js');
    writeFileSync(file, 'const x = 1;');

    const engine = new GuardrailEngine({ severityThreshold: 'high' });
    engine.registerRule(testRule); // warning severity — below threshold
    const result = await engine.scanFile(file);
    expect(result.violations).toHaveLength(0);

    rmSync(dir, { recursive: true });
  });

  it('disables rules via config', async () => {
    const dir = join(tmpdir(), `guardrail-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'test.js');
    writeFileSync(file, 'const x = 1;');

    const engine = new GuardrailEngine({ rules: { 'test/always-warn': false } });
    engine.registerRule(testRule);
    const result = await engine.scanFile(file);
    expect(result.violations).toHaveLength(0);

    rmSync(dir, { recursive: true });
  });

  it('scans a directory and returns summary', async () => {
    const dir = join(tmpdir(), `guardrail-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'a.js'), 'const a = 1;');
    writeFileSync(join(dir, 'b.js'), 'const b = 2;');

    const engine = new GuardrailEngine();
    engine.registerRule(testRule);
    const summary = await engine.scan(dir);
    expect(summary.totalFiles).toBe(2);
    expect(summary.totalViolations).toBe(2);

    rmSync(dir, { recursive: true });
  });
});
