import { createInterface } from 'readline';
import * as c from './colors.js';

/**
 * Zero-dependency interactive menu for CLI.
 * Shows numbered options and waits for user input.
 */

interface MenuOption {
  label: string;
  hint?: string;
  action: () => Promise<void> | void;
}

export async function showMenu(options: MenuOption[]): Promise<void> {
  console.log('');
  console.log(c.cyan(`  ┌${'─'.repeat(58)}┐`));
  console.log(c.cyan('  │') + c.bold(c.white('  WHAT WOULD YOU LIKE TO DO?                                ')) + c.cyan('│'));
  console.log(c.cyan(`  └${'─'.repeat(58)}┘`));
  console.log('');

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const num = c.bold(c.cyan(`  [${i + 1}]`));
    const hint = opt.hint ? c.dim(` — ${opt.hint}`) : '';
    console.log(`  ${num} ${c.white(opt.label)}${hint}`);
  }
  console.log(`  ${c.bold(c.dim('  [0]'))} ${c.dim('Exit')}`);
  console.log('');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve) => {
    rl.question(c.cyan('  → Pick an option: '), async (answer) => {
      rl.close();
      console.log('');

      const choice = parseInt(answer.trim(), 10);
      if (isNaN(choice) || choice === 0 || choice > options.length) {
        resolve();
        return;
      }

      const selected = options[choice - 1];
      if (selected) {
        await selected.action();
      }

      resolve();
    });
  });
}
