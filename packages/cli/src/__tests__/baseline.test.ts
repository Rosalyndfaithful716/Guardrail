import { describe, it, expect } from 'vitest';
import { filterBaseline } from '../commands/baseline.js';
import type { ScanSummary, Severity } from '@guardrail-ai/core';

describe('baseline filtering', () => {
  const makeSummary = (): ScanSummary => ({
    totalFiles: 2,
    totalViolations: 3,
    bySeverity: { critical: 1, high: 1, warning: 1, info: 0 },
    byRule: { 'security/sql-injection': 1, 'security/xss-vulnerability': 1, 'ai-codegen/unused-imports': 1 },
    results: [
      {
        filePath: '/project/src/auth.ts',
        violations: [
          {
            ruleId: 'security/sql-injection',
            severity: 'critical' as Severity,
            message: 'SQL injection detected',
            location: { file: '/project/src/auth.ts', line: 10, column: 5 },
          },
          {
            ruleId: 'security/xss-vulnerability',
            severity: 'high' as Severity,
            message: 'XSS vulnerability',
            location: { file: '/project/src/auth.ts', line: 20, column: 3 },
          },
        ],
      },
      {
        filePath: '/project/src/app.ts',
        violations: [
          {
            ruleId: 'ai-codegen/unused-imports',
            severity: 'warning' as Severity,
            message: '"lodash" is imported but never used.',
            location: { file: '/project/src/app.ts', line: 1, column: 0 },
          },
        ],
      },
    ],
  });

  it('filters out baseline violations', () => {
    const summary = makeSummary();
    const baseline = {
      version: 1 as const,
      created: '2026-01-01',
      count: 1,
      entries: [
        {
          ruleId: 'security/sql-injection',
          file: 'src/auth.ts',
          line: 10,
          message: 'SQL injection detected',
        },
      ],
    };

    const { filtered, suppressed } = filterBaseline(summary, baseline, '/project');
    expect(suppressed).toBe(1);
    expect(filtered.totalViolations).toBe(2);
    expect(filtered.bySeverity.critical).toBe(0);
    expect(filtered.bySeverity.high).toBe(1);
    expect(filtered.bySeverity.warning).toBe(1);
  });

  it('returns all violations when baseline has no matches', () => {
    const summary = makeSummary();
    const baseline = {
      version: 1 as const,
      created: '2026-01-01',
      count: 1,
      entries: [
        {
          ruleId: 'security/no-eval',
          file: 'src/other.ts',
          line: 5,
          message: 'eval() detected',
        },
      ],
    };

    const { filtered, suppressed } = filterBaseline(summary, baseline, '/project');
    expect(suppressed).toBe(0);
    expect(filtered.totalViolations).toBe(3);
  });

  it('filters multiple baseline entries', () => {
    const summary = makeSummary();
    const baseline = {
      version: 1 as const,
      created: '2026-01-01',
      count: 2,
      entries: [
        {
          ruleId: 'security/sql-injection',
          file: 'src/auth.ts',
          line: 10,
          message: 'SQL injection detected',
        },
        {
          ruleId: 'ai-codegen/unused-imports',
          file: 'src/app.ts',
          line: 1,
          message: '"lodash" is imported but never used.',
        },
      ],
    };

    const { filtered, suppressed } = filterBaseline(summary, baseline, '/project');
    expect(suppressed).toBe(2);
    expect(filtered.totalViolations).toBe(1);
    expect(filtered.bySeverity.high).toBe(1);
  });
});
