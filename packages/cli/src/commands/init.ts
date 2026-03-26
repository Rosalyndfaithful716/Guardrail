import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as c from '../colors.js';

export async function initCommand(): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.guardrailrc.json');

  if (existsSync(configPath)) {
    console.log(c.yellow('  .guardrailrc.json already exists. Skipping.'));
    return;
  }

  // Detect project type
  const hasTS = existsSync(join(cwd, 'tsconfig.json'));
  const hasSrc = existsSync(join(cwd, 'src'));

  const include = hasSrc
    ? ['src/**/*.{js,jsx,ts,tsx}']
    : ['**/*.{js,jsx,ts,tsx}'];

  const config = {
    include,
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**'],
    rules: {},
    severityThreshold: 'info',
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  console.log('');
  console.log(c.bold(c.green('  Created .guardrailrc.json')));
  console.log('');
  console.log(c.dim(`  Detected: ${hasTS ? 'TypeScript' : 'JavaScript'} project`));
  console.log(c.dim(`  Scanning: ${include[0]}`));
  console.log('');
  console.log(`  Run ${c.bold('guardrail scan')} to start scanning.`);
  console.log('');
}
