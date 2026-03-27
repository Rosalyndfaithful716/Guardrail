import { resolve, join } from 'path';
import { GuardrailEngine, loadConfig, mergeConfigs, discoverFiles } from '@guardrail-ai/core';
import type { Severity } from '@guardrail-ai/core';
import { builtinRules } from '@guardrail-ai/rules';
import { formatSummary } from '../formatter.js';
import { generateHtmlReport } from '../reporters/html-reporter.js';
import { generateMdReport } from '../reporters/md-reporter.js';
import { generateSarifReport } from '../reporters/sarif-reporter.js';
import { loadBaseline, filterBaseline } from './baseline.js';
import * as c from '../colors.js';
import { printBanner, printScanHeader } from '../banner.js';

interface ScanOptions {
  severity?: string;
  json?: boolean;
  report?: string;
  rules?: string;
}

export async function scanCommand(
  target: string,
  options: ScanOptions,
): Promise<void> {
  const cwd = process.cwd();
  const targetPath = resolve(cwd, target);

  const fileConfig = loadConfig(targetPath);
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

  if (!options.json) {
    printBanner();
    const files = await discoverFiles(targetPath, config);
    printScanHeader(targetPath, rules.length, files.length);
  }

  const start = performance.now();
  let summary = await engine.scan(targetPath);
  const elapsed = ((performance.now() - start) / 1000).toFixed(2);

  // Apply baseline filtering if baseline exists
  const baseline = loadBaseline(cwd);
  let suppressed = 0;
  if (baseline) {
    const result = filterBaseline(summary, baseline, cwd);
    summary = result.filtered;
    suppressed = result.suppressed;
  }

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(formatSummary(summary, cwd, elapsed));

  // Show baseline info
  if (suppressed > 0) {
    console.log(c.dim(`  ${suppressed} baseline issues suppressed. Run ${c.bold('guardrail baseline status')} for details.`));
    console.log('');
  }

  // Generate reports — supports comma-separated: --report html,md,sarif
  if (options.report) {
    const formats = options.report.split(',').map((f) => f.trim());

    for (const fmt of formats) {
      if (fmt === 'html') {
        const reportPath = join(cwd, 'guardrail-report.html');
        generateHtmlReport(summary, cwd, reportPath);
        console.log(c.green(`  ✓ HTML report: ${reportPath}`));
      }
      if (fmt === 'md') {
        const reportPath = join(cwd, 'GUARDRAIL-AUDIT.md');
        generateMdReport(summary, cwd, reportPath);
        console.log(c.green(`  ✓ Audit report: ${reportPath}`));
        console.log(c.dim(`    Feed this file to Claude/ChatGPT to fix all issues.`));
      }
      if (fmt === 'sarif') {
        const reportPath = join(cwd, 'guardrail.sarif');
        generateSarifReport(summary, cwd, reportPath);
        console.log(c.green(`  ✓ SARIF report: ${reportPath}`));
      }
    }
    console.log('');
  }

  if (summary.bySeverity.critical > 0 || summary.bySeverity.high > 0) {
    process.exitCode = 1;
  }
}
