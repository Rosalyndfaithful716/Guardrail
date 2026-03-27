#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan.js';
import { fixCommand } from './commands/fix.js';
import { initCommand } from './commands/init.js';
import { watchCommand } from './commands/watch.js';
import { diffCommand } from './commands/diff.js';
import { hookCommand } from './commands/hook.js';
import { baselineCommand } from './commands/baseline.js';

const program = new Command();

program
  .name('guardrail')
  .description(
    'Scan and fix AI-generated code for security, performance, and quality issues',
  )
  .version('0.1.1');

program
  .command('scan')
  .description('Scan a directory for code issues')
  .argument('[target]', 'Target directory to scan', '.')
  .option(
    '-s, --severity <level>',
    'Minimum severity to report (critical, high, warning, info)',
    'info',
  )
  .option('--json', 'Output results as JSON')
  .option('--report <formats>', 'Generate reports (html,md,sarif — comma-separated)')
  .option(
    '--rules <rules>',
    'Comma-separated list of rule IDs to run',
  )
  .action(scanCommand);

program
  .command('fix')
  .description('Auto-fix issues in a directory')
  .argument('[target]', 'Target directory to fix', '.')
  .option('-d, --dry-run', 'Show diffs without applying changes')
  .option(
    '-s, --severity <level>',
    'Minimum severity to fix (critical, high, warning, info)',
    'info',
  )
  .option(
    '--rules <rules>',
    'Comma-separated list of rule IDs to fix',
  )
  .action(fixCommand);

program
  .command('diff')
  .description('Scan only git-changed files (perfect for PRs)')
  .argument('[base]', 'Base branch or commit to diff against', 'HEAD')
  .option(
    '-s, --severity <level>',
    'Minimum severity to report',
    'info',
  )
  .option('--json', 'Output results as JSON')
  .option('--report <formats>', 'Generate reports (html,md,sarif)')
  .option('--rules <rules>', 'Comma-separated list of rule IDs')
  .option('--base <ref>', 'Base branch or commit')
  .action(diffCommand);

program
  .command('hook')
  .description('Manage git pre-commit hook')
  .argument('[action]', 'install or uninstall', 'install')
  .action(hookCommand);

program
  .command('baseline')
  .description('Manage baseline for gradual adoption')
  .argument('[action]', 'create, status, or clear')
  .option(
    '-s, --severity <level>',
    'Minimum severity for baseline',
    'info',
  )
  .action(baselineCommand);

program
  .command('init')
  .description('Initialize a .guardrailrc.json config file')
  .action(initCommand);

program
  .command('watch')
  .description('Watch for file changes and scan in real-time')
  .argument('[target]', 'Target directory to watch', '.')
  .option(
    '-s, --severity <level>',
    'Minimum severity to report',
    'info',
  )
  .action(watchCommand);

program.parse();
