import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { codeFrame } from '../code-frame.js';
import type { Violation } from '@guardrail-ai/core';

describe('codeFrame', () => {
  const tmpDir = join(tmpdir(), 'guardrail-codeframe-test-' + Date.now());
  const testFile = join(tmpDir, 'test.js');

  const source = `function getUser(db, userId) {
  return db.query("SELECT * FROM users WHERE id = " + userId);
}

function clean() {
  return true;
}`;

  beforeAll(() => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(testFile, source);
  });

  afterAll(() => {
    try { rmSync(tmpDir, { recursive: true }); } catch {}
  });

  it('generates code frame for a violation', () => {
    const v: Violation = {
      ruleId: 'security/sql-injection',
      severity: 'critical',
      message: 'SQL injection',
      location: { file: testFile, line: 2, column: 19 },
    };

    const frame = codeFrame(v, 1);
    expect(frame).not.toBeNull();
    expect(frame).toContain('>');
    expect(frame).toContain('^^^');
    expect(frame).toContain('SELECT');
  });

  it('returns null for non-existent file', () => {
    const v: Violation = {
      ruleId: 'test/rule',
      severity: 'warning',
      message: 'test',
      location: { file: '/nonexistent/path/file.js', line: 1, column: 0 },
    };

    const frame = codeFrame(v);
    expect(frame).toBeNull();
  });

  it('returns null for out-of-range line', () => {
    const v: Violation = {
      ruleId: 'test/rule',
      severity: 'warning',
      message: 'test',
      location: { file: testFile, line: 999, column: 0 },
    };

    const frame = codeFrame(v);
    expect(frame).toBeNull();
  });

  it('shows context lines around the violation', () => {
    const v: Violation = {
      ruleId: 'test/rule',
      severity: 'critical',
      message: 'test',
      location: { file: testFile, line: 2, column: 0 },
    };

    const frame = codeFrame(v, 2);
    expect(frame).not.toBeNull();
    expect(frame).toContain('function getUser');
    expect(frame).toContain('return db.query');
  });
});
