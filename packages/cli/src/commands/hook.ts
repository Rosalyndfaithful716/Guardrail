import { existsSync, mkdirSync, writeFileSync, chmodSync, readFileSync } from 'fs';
import { join } from 'path';
import * as c from '../colors.js';
import { printBanner } from '../banner.js';

const PRE_COMMIT_HOOK = `#!/bin/sh
# Guardrail pre-commit hook — scans staged files for issues
# Installed by: guardrail hook install

# Get staged JS/TS files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\\.(js|jsx|ts|tsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo ""
echo "  Guardrail: scanning staged files..."
echo ""

# Run guardrail on each staged file
FAILED=0
for FILE in $STAGED_FILES; do
  if [ -f "$FILE" ]; then
    npx @guardrail-ai/cli scan "$FILE" --severity high --json > /dev/null 2>&1
    RESULT=$?
    if [ $RESULT -ne 0 ]; then
      FAILED=1
    fi
  fi
done

if [ $FAILED -ne 0 ]; then
  echo ""
  npx @guardrail-ai/cli scan . --severity high 2>&1 | head -60
  echo ""
  echo "  Guardrail found critical/high issues in staged files."
  echo "  Fix them before committing, or bypass with: git commit --no-verify"
  echo ""
  exit 1
fi

exit 0
`;

export async function hookCommand(
  action: string,
): Promise<void> {
  const cwd = process.cwd();

  printBanner();

  if (action === 'install') {
    installHook(cwd);
  } else if (action === 'uninstall') {
    uninstallHook(cwd);
  } else {
    console.log(`  ${c.yellow('Usage:')} guardrail hook ${c.bold('install')} | ${c.bold('uninstall')}`);
    console.log('');
    console.log(`  ${c.dim('install')}     Add pre-commit hook that scans staged files`);
    console.log(`  ${c.dim('uninstall')}   Remove the guardrail pre-commit hook`);
    console.log('');
  }
}

function installHook(cwd: string): void {
  const gitDir = join(cwd, '.git');
  if (!existsSync(gitDir)) {
    console.log(`  ${c.brightRed('✖')} Not a git repository. Run ${c.bold('git init')} first.`);
    console.log('');
    return;
  }

  const hooksDir = join(gitDir, 'hooks');
  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
  }

  const hookPath = join(hooksDir, 'pre-commit');

  // Check if a hook already exists
  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, 'utf-8');
    if (existing.includes('Guardrail pre-commit hook')) {
      console.log(`  ${c.yellow('●')} Guardrail hook already installed.`);
      console.log('');
      return;
    }

    // Append to existing hook
    const combined = existing.trimEnd() + '\n\n' + PRE_COMMIT_HOOK;
    writeFileSync(hookPath, combined);
    chmodSync(hookPath, '755');
    console.log(`  ${c.brightGreen('✓')} ${c.bold('Appended')} guardrail check to existing pre-commit hook`);
  } else {
    writeFileSync(hookPath, PRE_COMMIT_HOOK);
    chmodSync(hookPath, '755');
    console.log(`  ${c.brightGreen('✓')} ${c.bold('Installed')} pre-commit hook`);
  }

  console.log('');
  console.log(`  ${c.bold('What it does')}`);
  console.log(`    ${c.dim('├──')} Runs on every ${c.white('git commit')}`);
  console.log(`    ${c.dim('├──')} Scans only staged JS/TS files`);
  console.log(`    ${c.dim('├──')} Blocks commits with ${c.red('critical')} or ${c.red('high')} issues`);
  console.log(`    ${c.dim('└──')} Bypass with ${c.dim('git commit --no-verify')}`);
  console.log('');
}

function uninstallHook(cwd: string): void {
  const hookPath = join(cwd, '.git', 'hooks', 'pre-commit');

  if (!existsSync(hookPath)) {
    console.log(`  ${c.dim('No pre-commit hook found.')}`);
    console.log('');
    return;
  }

  const content = readFileSync(hookPath, 'utf-8');
  if (!content.includes('Guardrail pre-commit hook')) {
    console.log(`  ${c.dim('No guardrail hook found in pre-commit.')}`);
    console.log('');
    return;
  }

  // Remove the guardrail section
  const lines = content.split('\n');
  const startIdx = lines.findIndex((l) => l.includes('Guardrail pre-commit hook'));
  if (startIdx > 0) {
    // Remove from 2 lines before (#!/bin/sh and comment) to end
    const cleaned = lines.slice(0, Math.max(0, startIdx - 1)).join('\n').trim();
    if (cleaned.length === 0 || cleaned === '#!/bin/sh') {
      // Remove the entire file if only guardrail was in it
      const { unlinkSync } = require('fs');
      unlinkSync(hookPath);
      console.log(`  ${c.brightGreen('✓')} Removed pre-commit hook`);
    } else {
      writeFileSync(hookPath, cleaned + '\n');
      console.log(`  ${c.brightGreen('✓')} Removed guardrail from pre-commit hook`);
    }
  }

  console.log('');
}
