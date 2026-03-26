import { resolve } from 'path';
import { GuardrailEngine, loadConfig, mergeConfigs } from '@guardrail/core';
import type { Severity } from '@guardrail/core';
import { builtinRules } from '@guardrail/rules';
import { formatSummary } from '../formatter.js';
import * as c from '../colors.js';

interface ScanOptions {
  severity?: string;
  json?: boolean;
  rules?: string;
}

export async function scanCommand(
  target: string,
  options: ScanOptions,
): Promise<void> {
  const cwd = process.cwd();
  const targetPath = resolve(cwd, target);

  if (!options.json) {
    console.log('');
    console.log(c.bold(c.cyan('  Guardrail')) + c.dim(' — scanning for issues...'));
    console.log(c.dim(`  Target: ${targetPath}`));
    console.log('');
  }

  // Load config file, merge with CLI options
  const fileConfig = loadConfig(targetPath);
  const config = mergeConfigs(fileConfig, {
    severityThreshold: (options.severity as Severity) ?? undefined,
  });

  const engine = new GuardrailEngine(config);

  // Register rules
  let rules = builtinRules;
  if (options.rules) {
    const ruleIds = new Set(options.rules.split(',').map((r) => r.trim()));
    rules = builtinRules.filter((r) => ruleIds.has(r.id));
  }
  engine.registerRules(rules);

  const start = performance.now();
  const summary = await engine.scan(targetPath);
  const elapsed = ((performance.now() - start) / 1000).toFixed(2);

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(formatSummary(summary, cwd, elapsed));

  // Exit with non-zero code if critical/high issues found
  if (summary.bySeverity.critical > 0 || summary.bySeverity.high > 0) {
    process.exitCode = 1;
  }
}
