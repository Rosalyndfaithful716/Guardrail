import * as c from './colors.js';

export function printBanner(): void {
  console.log('');
  console.log(c.cyan(`   ____                     _           _ _ `));
  console.log(c.cyan(`  / ___|_   _  __ _ _ __ __| |_ __ __ _(_) |`));
  console.log(c.cyan(` | |  _| | | |/ _\` | '__/ _\` | '__/ _\` | | |`));
  console.log(c.cyan(` | |_| | |_| | (_| | | | (_| | | | (_| | | |`));
  console.log(c.cyan(`  \\____|\\__,_|\\__,_|_|  \\__,_|_|  \\__,_|_|_|`));
  console.log('');
  console.log(c.dim(`  The safety layer for AI-generated code.`));
  console.log('');
}

export function printScanHeader(target: string, ruleCount: number, fileCount: number): void {
  const line = c.dim('  ──────────────────────────────────────────────────────────');
  console.log(line);
  console.log(`  ${c.bold('Target')}     ${c.white(target)}`);
  console.log(`  ${c.bold('Rules')}      ${c.cyan(String(ruleCount))} rules ${c.dim('across')} ${c.cyan('4')} categories`);
  console.log(`  ${c.bold('Files')}      ${c.cyan(String(fileCount))} files to scan`);
  console.log(`  ${c.bold('Engine')}     AST-powered ${c.dim('(Babel parser)')}`);
  console.log(line);
  console.log('');
}
