import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as c from '../colors.js';
import { printBanner } from '../banner.js';

export async function initCommand(): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.guardrailrc.json');

  printBanner();

  if (existsSync(configPath)) {
    console.log(`  ${c.yellow('●')} ${c.yellow('.guardrailrc.json already exists.')} Skipping.`);
    console.log(c.dim('    Delete it first if you want to regenerate.'));
    console.log('');
    return;
  }

  // Detect project type
  const hasTS = existsSync(join(cwd, 'tsconfig.json'));
  const hasSrc = existsSync(join(cwd, 'src'));
  const hasNext = existsSync(join(cwd, 'next.config.js')) || existsSync(join(cwd, 'next.config.ts')) || existsSync(join(cwd, 'next.config.mjs'));

  const include = hasSrc
    ? ['src/**/*.{js,jsx,ts,tsx}']
    : ['**/*.{js,jsx,ts,tsx}'];

  const config = {
    include,
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.next/**'],
    rules: {},
    severityThreshold: 'info',
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  const line = c.dim('  ──────────────────────────────────────────────────────────');
  console.log(line);
  console.log(`  ${c.brightGreen('✓')} ${c.bold(c.white('Created .guardrailrc.json'))}`);
  console.log(line);
  console.log('');
  console.log(`  ${c.bold('Detected')}`);
  console.log(`    ${c.dim('├──')} Language    ${hasTS ? c.cyan('TypeScript') : c.yellow('JavaScript')}`);
  if (hasNext) console.log(`    ${c.dim('├──')} Framework   ${c.white('Next.js')}`);
  console.log(`    ${c.dim('└──')} Scanning    ${c.dim(include[0])}`);
  console.log('');
  console.log(`  ${c.bold('Get started')}`);
  console.log(`    ${c.dim('$')} ${c.white('guardrail scan .')}            ${c.dim('# scan your project')}`);
  console.log(`    ${c.dim('$')} ${c.white('guardrail fix .')}             ${c.dim('# auto-fix issues')}`);
  console.log(`    ${c.dim('$')} ${c.white('guardrail scan . --report md')} ${c.dim('# AI-guided fix report')}`);
  console.log(`    ${c.dim('$')} ${c.white('guardrail watch .')}           ${c.dim('# real-time scanning')}`);
  console.log('');
}
