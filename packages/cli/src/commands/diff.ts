import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { GuardrailEngine, loadConfig, mergeConfigs } from '@guardrail-ai/core';
import type { Severity } from '@guardrail-ai/core';
import { builtinRules } from '@guardrail-ai/rules';
import { formatSummary } from '../formatter.js';
import { generateMdReport } from '../reporters/md-reporter.js';
import { generateSarifReport } from '../reporters/sarif-reporter.js';
import { generateHtmlReport } from '../reporters/html-reporter.js';
import * as c from '../colors.js';
import { printBanner } from '../banner.js';

interface DiffOptions {
  severity?: string;
  json?: boolean;
  report?: string;
  rules?: string;
  base?: string;
}

function getChangedFiles(cwd: string, base: string): string[] {
  try {
    // Get files changed compared to base branch/commit
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
    // Fallback: get staged + unstaged changes
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

export async function diffCommand(
  base: string | undefined,
  options: DiffOptions,
): Promise<void> {
  const cwd = process.cwd();
  const baseBranch = base || options.base || 'HEAD';

  if (!options.json) {
    printBanner();

    const line = c.dim('  ──────────────────────────────────────────────────────────');
    console.log(line);
    console.log(`  ${c.bold('Mode')}       ${c.brightCyan('Diff scan')} ${c.dim('— only changed files')}`);
    console.log(`  ${c.bold('Base')}       ${c.white(baseBranch)}`);
    console.log(line);
    console.log('');
  }

  const changedFiles = getChangedFiles(cwd, baseBranch);

  if (changedFiles.length === 0) {
    if (!options.json) {
      console.log(`  ${c.brightGreen('✓')} ${c.dim('No changed JS/TS files found.')}`);
      console.log('');
    } else {
      console.log(JSON.stringify({ totalFiles: 0, totalViolations: 0, results: [] }));
    }
    return;
  }

  if (!options.json) {
    console.log(c.dim(`  Found ${changedFiles.length} changed file${changedFiles.length > 1 ? 's' : ''}...`));
    console.log('');
  }

  const fileConfig = loadConfig(cwd);
  const config = mergeConfigs(fileConfig, {
    severityThreshold: (options.severity as Severity) ?? undefined,
  });

  const engine = new GuardrailEngine(config);
  engine.enableCache(cwd);

  let rules = builtinRules;
  if (options.rules) {
    const ruleIds = new Set(options.rules.split(',').map((r) => r.trim()));
    rules = builtinRules.filter((r) => ruleIds.has(r.id));
  }
  engine.registerRules(rules);

  const start = performance.now();

  // Scan only changed files
  const results = await Promise.all(changedFiles.map((f) => engine.scanFile(f)));

  const summary = {
    totalFiles: changedFiles.length,
    totalViolations: 0,
    bySeverity: { critical: 0, high: 0, warning: 0, info: 0 } as Record<Severity, number>,
    byRule: {} as Record<string, number>,
    results,
  };

  for (const result of results) {
    for (const v of result.violations) {
      summary.totalViolations++;
      summary.bySeverity[v.severity]++;
      summary.byRule[v.ruleId] = (summary.byRule[v.ruleId] || 0) + 1;
    }
  }

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(formatSummary(summary, cwd, elapsed));

  // Reports
  if (options.report) {
    const formats = options.report.split(',').map((f) => f.trim());
    for (const fmt of formats) {
      if (fmt === 'html') {
        const p = join(cwd, 'guardrail-report.html');
        generateHtmlReport(summary, cwd, p);
        console.log(c.green(`  ✓ HTML report: ${p}`));
      }
      if (fmt === 'md') {
        const p = join(cwd, 'GUARDRAIL-AUDIT.md');
        generateMdReport(summary, cwd, p);
        console.log(c.green(`  ✓ Audit report: ${p}`));
      }
      if (fmt === 'sarif') {
        const p = join(cwd, 'guardrail.sarif');
        generateSarifReport(summary, cwd, p);
        console.log(c.green(`  ✓ SARIF report: ${p}`));
      }
    }
    console.log('');
  }

  if (summary.bySeverity.critical > 0 || summary.bySeverity.high > 0) {
    process.exitCode = 1;
  }
}
