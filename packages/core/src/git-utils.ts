import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Get JS/TS files changed relative to a git base ref.
 * Falls back to staged + unstaged changes if the base ref fails.
 */
export function getChangedFiles(cwd: string, base: string): string[] {
  try {
    const output = execSync(`git diff --name-only --diff-filter=ACMR ${base}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return output
      .trim()
      .split('\n')
      .filter((f) => f && /\.(js|jsx|ts|tsx)$/.test(f))
      .map((f) => resolve(cwd, f))
      .filter((f) => existsSync(f));
  } catch {
    try {
      const staged = execSync('git diff --cached --name-only --diff-filter=ACMR', {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const unstaged = execSync('git diff --name-only --diff-filter=ACMR', {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const all = new Set([
        ...staged.trim().split('\n'),
        ...unstaged.trim().split('\n'),
      ]);

      return [...all]
        .filter((f) => f && /\.(js|jsx|ts|tsx)$/.test(f))
        .map((f) => resolve(cwd, f))
        .filter((f) => existsSync(f));
    } catch {
      return [];
    }
  }
}
