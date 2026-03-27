import { describe, it, expect } from 'vitest';
import { GuardrailEngine, parseSource } from '../index.js';
import type { Rule, RuleContext, Violation } from '../types.js';

// Simple test rule that flags every string literal
const testRule: Rule = {
  id: 'test/string-literal',
  name: 'String Literal',
  description: 'Flags all string literals',
  severity: 'warning',
  category: 'quality',
  detect(context: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const lines = context.source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/"([^"]*)"/);
      if (match) {
        violations.push({
          ruleId: 'test/string-literal',
          severity: 'warning',
          message: `String literal "${match[1]}" found`,
          location: {
            file: context.filePath,
            line: i + 1,
            column: lines[i].indexOf('"'),
          },
        });
      }
    }
    return violations;
  },
};

describe('inline ignore comments', () => {
  it('suppresses with // guardrail-ignore-next-line', async () => {
    const engine = new GuardrailEngine();
    engine.registerRule(testRule);

    // We need to test via the engine's internal suppression
    // Create a mock file scenario
    const source = `const a = "hello";
// guardrail-ignore-next-line
const b = "world";
const c = "foo";`;

    const ast = parseSource(source, 'test.js');
    // Access the private method via prototype
    const parseIgnore = (engine as any).parseIgnoreComments.bind(engine);
    const ignores = parseIgnore(source);

    // Line 3 should be ignored (next line after comment on line 2)
    expect(ignores.has(3)).toBe(true);
    expect(ignores.get(3)).toBe('all');
    // Line 1 and 4 should NOT be ignored
    expect(ignores.has(1)).toBe(false);
    expect(ignores.has(4)).toBe(false);
  });

  it('suppresses specific rule with // guardrail-ignore-next-line rule-id', async () => {
    const engine = new GuardrailEngine();
    engine.registerRule(testRule);

    const source = `const a = "hello";
// guardrail-ignore-next-line test/string-literal
const b = "world";`;

    const parseIgnore = (engine as any).parseIgnoreComments.bind(engine);
    const ignores = parseIgnore(source);

    expect(ignores.has(3)).toBe(true);
    const rules = ignores.get(3);
    expect(rules).toBeInstanceOf(Set);
    expect((rules as Set<string>).has('test/string-literal')).toBe(true);
  });

  it('suppresses with inline // guardrail-ignore on same line', async () => {
    const engine = new GuardrailEngine();

    const source = `const a = "hello"; // guardrail-ignore
const b = "world";`;

    const parseIgnore = (engine as any).parseIgnoreComments.bind(engine);
    const ignores = parseIgnore(source);

    // Line 1 (same line) should be ignored
    expect(ignores.has(1)).toBe(true);
    expect(ignores.has(2)).toBe(false);
  });

  it('handles multiple comma-separated rules', async () => {
    const engine = new GuardrailEngine();

    const source = `// guardrail-ignore-next-line security/sql-injection, security/xss-vulnerability
const q = db.query("SELECT " + x);`;

    const parseIgnore = (engine as any).parseIgnoreComments.bind(engine);
    const ignores = parseIgnore(source);

    expect(ignores.has(2)).toBe(true);
    const rules = ignores.get(2) as Set<string>;
    expect(rules.has('security/sql-injection')).toBe(true);
    expect(rules.has('security/xss-vulnerability')).toBe(true);
  });
});
