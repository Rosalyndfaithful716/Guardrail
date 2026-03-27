import { resolve, relative, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { GuardrailEngine, loadConfig, mergeConfigs } from '@guardrail-ai/core';
import type { Severity, ScanSummary } from '@guardrail-ai/core';
import { builtinRules } from '@guardrail-ai/rules';
import * as c from '../colors.js';
import { printBanner } from '../banner.js';

const BASELINE_FILE = '.guardrailbaseline.json';

interface BaselineEntry {
  ruleId: string;
  file: string;
  line: number;
  message: string;
}

interface Baseline {
  version: 1;
  created: string;
  count: number;
  entries: BaselineEntry[];
}

/**
 * Load the baseline ignore file
 */
export function loadBaseline(cwd: string): Baseline | null {
  const path = join(cwd, BASELINE_FILE);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Filter out violations that match the baseline
 */
export function filterBaseline(summary: ScanSummary, baseline: Baseline, cwd: string): { filtered: ScanSummary; suppressed: number } {
  let suppressed = 0;

  const baselineSet = new Set(
    baseline.entries.map((e) => `${e.ruleId}:${e.file}:${e.message}`),
  );

  const filteredResults = summary.results.map((result) => {
    const relPath = relative(cwd, result.filePath);
    const kept = result.violations.filter((v) => {
      const key = `${v.ruleId}:${relPath}:${v.message}`;
      if (baselineSet.has(key)) {
        suppressed++;
        return false;
      }
      return true;
    });
    return { ...result, violations: kept };
  });

  // Recompute summary
  const filtered: ScanSummary = {
    totalFiles: summary.totalFiles,
    totalViolations: 0,
    bySeverity: { critical: 0, high: 0, warning: 0, info: 0 },
    byRule: {},
    results: filteredResults,
  };

  for (const result of filteredResults) {
    for (const v of result.violations) {
      filtered.totalViolations++;
      filtered.bySeverity[v.severity]++;
      filtered.byRule[v.ruleId] = (filtered.byRule[v.ruleId] || 0) + 1;
    }
  }

  return { filtered, suppressed };
}

/**
 * Generate baseline from current scan
 */
export async function baselineCommand(
  action: string,
  options: { severity?: string },
): Promise<void> {
  const cwd = process.cwd();

  printBanner();

  if (action === 'create') {
    await createBaseline(cwd, options);
  } else if (action === 'status') {
    showBaselineStatus(cwd);
  } else if (action === 'clear') {
    clearBaseline(cwd);
  } else {
    console.log(`  ${c.yellow('Usage:')} guardrail baseline ${c.bold('create')} | ${c.bold('status')} | ${c.bold('clear')}`);
    console.log('');
    console.log(`  ${c.dim('create')}   Snapshot current issues as the baseline (suppress in future scans)`);
    console.log(`  ${c.dim('status')}   Show how many issues are in the baseline`);
    console.log(`  ${c.dim('clear')}    Remove the baseline file`);
    console.log('');
    console.log(`  ${c.bold('How it works')}`);
    console.log(`    When a baseline exists, ${c.white('guardrail scan')} only reports ${c.bold('new')} issues.`);
    console.log(`    Existing issues are suppressed. This lets you adopt guardrail gradually.`);
    console.log('');
  }
}

async function createBaseline(cwd: string, options: { severity?: string }): Promise<void> {
  const fileConfig = loadConfig(cwd);
  const config = mergeConfigs(fileConfig, {
    severityThreshold: (options.severity as Severity) ?? undefined,
  });

  const engine = new GuardrailEngine(config);
  engine.registerRules(builtinRules);

  console.log(c.dim('  Scanning to create baseline...'));
  console.log('');

  const summary = await engine.scan(cwd);

  const entries: BaselineEntry[] = [];
  for (const result of summary.results) {
    const relPath = relative(cwd, result.filePath);
    for (const v of result.violations) {
      entries.push({
        ruleId: v.ruleId,
        file: relPath,
        line: v.location.line,
        message: v.message,
      });
    }
  }

  const baseline: Baseline = {
    version: 1,
    created: new Date().toISOString(),
    count: entries.length,
    entries,
  };

  const path = join(cwd, BASELINE_FILE);
  writeFileSync(path, JSON.stringify(baseline, null, 2) + '\n');

  console.log(`  ${c.brightGreen('✓')} ${c.bold(`Baseline created with ${entries.length} suppressed issues`)}`);
  console.log(`    ${c.dim('File:')} ${BASELINE_FILE}`);
  console.log('');
  console.log(`  ${c.bold('What happens now')}`);
  console.log(`    ${c.dim('├──')} ${c.white('guardrail scan')} will only flag ${c.bold('new')} issues`);
  console.log(`    ${c.dim('├──')} Baseline issues are silently suppressed`);
  console.log(`    ${c.dim('├──')} Fix baseline issues over time, then run ${c.white('guardrail baseline create')} again`);
  console.log(`    ${c.dim('└──')} Commit ${c.dim(BASELINE_FILE)} to track progress across the team`);
  console.log('');
}

function showBaselineStatus(cwd: string): void {
  const baseline = loadBaseline(cwd);

  if (!baseline) {
    console.log(`  ${c.dim('No baseline file found.')}`);
    console.log(`  Run ${c.white('guardrail baseline create')} to create one.`);
    console.log('');
    return;
  }

  const bySev: Record<string, number> = {};
  const byCat: Record<string, number> = {};
  for (const e of baseline.entries) {
    const cat = e.ruleId.split('/')[0];
    byCat[cat] = (byCat[cat] || 0) + 1;
  }

  console.log(`  ${c.bold('Baseline Status')}`);
  console.log(`    Created     ${c.dim(baseline.created)}`);
  console.log(`    Suppressed  ${c.bold(String(baseline.count))} issues`);
  console.log('');

  if (Object.keys(byCat).length > 0) {
    console.log(`  ${c.bold('By Category')}`);
    for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${c.dim('├──')} ${cat.padEnd(14)} ${c.bold(String(count))}`);
    }
    console.log('');
  }
}

function clearBaseline(cwd: string): void {
  const path = join(cwd, BASELINE_FILE);
  if (!existsSync(path)) {
    console.log(`  ${c.dim('No baseline file to remove.')}`);
    console.log('');
    return;
  }

  const { unlinkSync } = require('fs');
  unlinkSync(path);
  console.log(`  ${c.brightGreen('✓')} Baseline removed. All issues will be reported.`);
  console.log('');
}
