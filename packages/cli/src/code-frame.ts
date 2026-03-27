import { readFileSync } from 'fs';
import type { Violation } from '@guardrail-ai/core';
import * as c from './colors.js';

/**
 * Generates an inline code frame showing the problematic source code
 * with the violation line highlighted. Like Babel/TypeScript error output.
 *
 *     40 |   const user = getUser(id);
 *     41 |
 *   > 42 |   return db.query("SELECT * FROM users WHERE id = " + userId);
 *        |                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 *     43 | }
 */
export function codeFrame(v: Violation, contextLines = 2): string | null {
  let source: string;
  try {
    source = readFileSync(v.location.file, 'utf-8');
  } catch {
    return null;
  }

  const lines = source.split('\n');
  const line = v.location.line; // 1-indexed
  const col = v.location.column; // 0-indexed

  if (line < 1 || line > lines.length) return null;

  const startLine = Math.max(1, line - contextLines);
  const endLine = Math.min(lines.length, line + contextLines);
  const gutterWidth = String(endLine).length;

  const output: string[] = [];

  for (let i = startLine; i <= endLine; i++) {
    const lineContent = lines[i - 1];
    const gutter = String(i).padStart(gutterWidth);
    const isTarget = i === line;

    if (isTarget) {
      // Highlighted line
      output.push(
        `      ${c.brightRed('>')} ${c.dim(gutter)} ${c.dim('│')} ${c.white(lineContent)}`,
      );

      // Underline indicator
      if (col >= 0) {
        const endCol = v.location.endColumn ?? Math.min(col + 30, lineContent.length);
        const underlineLen = Math.max(1, endCol - col);
        const padding = ' '.repeat(col);
        output.push(
          `        ${' '.repeat(gutterWidth)} ${c.dim('│')} ${padding}${c.brightRed('^'.repeat(underlineLen))}`,
        );
      }
    } else {
      output.push(
        `        ${c.dim(gutter)} ${c.dim('│')} ${c.dim(lineContent)}`,
      );
    }
  }

  return output.join('\n');
}
