import { resolve, relative } from 'path';
import { watch } from 'chokidar';
import { GuardrailEngine, loadConfig, mergeConfigs } from '@guardrail-ai/core';
import type { Severity } from '@guardrail-ai/core';
import { builtinRules } from '@guardrail-ai/rules';
import { formatFileResult } from '../formatter.js';
import * as c from '../colors.js';
import { printBanner } from '../banner.js';

interface WatchOptions {
  severity?: string;
}

export async function watchCommand(
  target: string,
  options: WatchOptions,
): Promise<void> {
  const cwd = process.cwd();
  const targetPath = resolve(cwd, target);

  const fileConfig = loadConfig(targetPath);
  const config = mergeConfigs(fileConfig, {
    severityThreshold: (options.severity as Severity) ?? undefined,
  });

  const engine = new GuardrailEngine(config);
  engine.registerRules(builtinRules);

  printBanner();

  const line = c.dim('  ──────────────────────────────────────────────────────────');
  console.log(line);
  console.log(`  ${c.bold('Mode')}       ${c.brightCyan('Watch')} ${c.dim('— real-time scanning on file changes')}`);
  console.log(`  ${c.bold('Target')}     ${c.white(targetPath)}`);
  console.log(`  ${c.bold('Rules')}      ${c.cyan(String(builtinRules.length))} rules active`);
  console.log(line);
  console.log('');
  console.log(c.dim(`  Watching for changes... (Ctrl+C to stop)`));
  console.log('');

  const watcher = watch(targetPath, {
    ignored: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
    persistent: true,
    ignoreInitial: true,
  });

  const scanFile = async (filePath: string) => {
    if (!/\.(js|jsx|ts|tsx)$/.test(filePath)) return;

    const time = new Date().toLocaleTimeString();
    const relPath = relative(cwd, filePath);

    try {
      const result = await engine.scanFile(filePath);
      const output = formatFileResult(result, cwd);

      if (output) {
        const count = result.violations.length;
        const crits = result.violations.filter((v) => v.severity === 'critical').length;
        const icon = crits > 0
          ? c.brightRed('✖')
          : c.yellow('▲');

        console.log(`  ${icon} ${c.dim(time)} ${c.bold(c.white(relPath))} — ${count} issue${count > 1 ? 's' : ''}`);
        console.log(output);
        console.log('');
      } else {
        console.log(`  ${c.brightGreen('✓')} ${c.dim(time)} ${c.white(relPath)} ${c.dim('—')} ${c.brightGreen('clean')}`);
      }
    } catch {
      // Skip files that can't be scanned
    }
  };

  watcher.on('change', scanFile);
  watcher.on('add', scanFile);

  process.on('SIGINT', () => {
    console.log('');
    console.log(c.dim('  Watch stopped.'));
    console.log('');
    watcher.close();
    process.exit(0);
  });
}
