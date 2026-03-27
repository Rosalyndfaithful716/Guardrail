import { resolve, relative } from 'path';
import { GuardrailEngine, loadConfig, mergeConfigs } from '@guardrail-ai/core';
import type { Severity } from '@guardrail-ai/core';
import { builtinRules } from '@guardrail-ai/rules';
import { FixerEngine } from '@guardrail-ai/fixer';
import { formatDiff } from '../formatter.js';
import * as c from '../colors.js';
import { printBanner } from '../banner.js';

interface FixOptions {
  dryRun?: boolean;
  severity?: string;
  rules?: string;
}

export async function fixCommand(
  target: string,
  options: FixOptions,
): Promise<void> {
  const cwd = process.cwd();
  const targetPath = resolve(cwd, target);

  printBanner();

  const line = c.dim('  ──────────────────────────────────────────────────────────');
  console.log(line);
  if (options.dryRun) {
    console.log(`  ${c.bold('Mode')}       ${c.yellow('Dry run')} ${c.dim('— preview changes without writing')}`);
  } else {
    console.log(`  ${c.bold('Mode')}       ${c.brightGreen('Apply fixes')} ${c.dim('— writing changes to disk')}`);
  }
  console.log(`  ${c.bold('Target')}     ${c.white(targetPath)}`);
  console.log(`  ${c.bold('Engine')}     AST-powered transforms ${c.dim('(not regex)')}`);
  console.log(line);
  console.log('');

  const fileConfig = loadConfig(targetPath);
  const config = mergeConfigs(fileConfig, {
    severityThreshold: (options.severity as Severity) ?? undefined,
  });

  const engine = new GuardrailEngine(config);

  let rules = builtinRules;
  if (options.rules) {
    const ruleIds = new Set(options.rules.split(',').map((r) => r.trim()));
    rules = builtinRules.filter((r) => ruleIds.has(r.id));
  }
  engine.registerRules(rules);

  const summary = await engine.scan(targetPath);

  const fixer = new FixerEngine();
  let totalFixed = 0;
  let totalSkipped = 0;
  let totalFiles = 0;

  for (const result of summary.results) {
    const fixable = result.violations.filter((v) => v.fix);
    if (fixable.length === 0) continue;

    const fixResult = await fixer.applyFixes(
      result.filePath,
      result.violations,
      !options.dryRun,
    );

    if (fixResult.applied > 0) {
      totalFiles++;
      totalFixed += fixResult.applied;
      totalSkipped += fixResult.skipped;

      const relPath = relative(cwd, result.filePath);
      console.log(`  ${c.brightGreen('✓')} ${c.bold(c.white(relPath))} ${c.dim('—')} ${c.brightGreen(`${fixResult.applied} fixed`)}${fixResult.skipped > 0 ? c.dim(`, ${fixResult.skipped} skipped`) : ''}`);

      if (fixResult.diff) {
        console.log('');
        console.log(formatDiff(fixResult.diff));
        console.log('');
      }
    }
  }

  // Summary
  console.log(c.cyan(`  ╔${'══════════════════════════════════════════════════════════'}╗`));
  console.log(c.cyan(`  ║`) + c.bold(c.white('  FIX RESULTS                                              ')) + c.cyan('║'));
  console.log(c.cyan(`  ╚${'══════════════════════════════════════════════════════════'}╝`));
  console.log('');

  if (totalFixed === 0) {
    console.log(`  ${c.dim('No auto-fixable issues found.')}`);

    if (summary.totalViolations > 0) {
      console.log('');
      console.log(`  ${c.yellow('●')} ${summary.totalViolations} issues require manual fixes.`);
      console.log(`    ${c.dim('$')} ${c.white('guardrail scan . --report md')}  ${c.dim('# get a fix guide for your AI')}`);
    }
  } else {
    const action = options.dryRun ? 'would be fixed' : 'fixed';
    console.log(
      `  ${c.brightGreen('✓')} ${c.bold(c.brightGreen(`${totalFixed} issues ${action}`))} across ${totalFiles} file${totalFiles > 1 ? 's' : ''}`,
    );

    const remaining = summary.totalViolations - totalFixed;
    if (remaining > 0) {
      console.log(`  ${c.yellow('●')} ${remaining} remaining issues need manual attention`);
      console.log(`    ${c.dim('$')} ${c.white('guardrail scan . --report md')}  ${c.dim('# generates a fix guide')}`);
    }

    if (options.dryRun) {
      console.log('');
      console.log(`  ${c.cyan('↳')} Run without ${c.bold('--dry-run')} to apply: ${c.white('guardrail fix .')}`);
    }
  }

  console.log('');
}
