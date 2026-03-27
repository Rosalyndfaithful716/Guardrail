import { relative } from 'path';
import type { ScanSummary, ScanResult, Violation, Severity } from '@guardrail-ai/core';
import * as c from './colors.js';
import { codeFrame } from './code-frame.js';

// ─── Severity display ──────────────────────────────────────────────

const SEVERITY_BADGE: Record<Severity, string> = {
  critical: c.bgRed(c.bold(c.white(' CRIT '))),
  high: c.bgMagenta(c.bold(c.white(' HIGH '))),
  warning: c.bgYellow(c.bold(' WARN ')),
  info: c.bgBlue(c.bold(c.white(' INFO '))),
};

const SEVERITY_COLOR: Record<Severity, (s: string) => string> = {
  critical: c.brightRed,
  high: c.red,
  warning: c.yellow,
  info: c.blue,
};

const SEVERITY_ICON: Record<Severity, string> = {
  critical: c.brightRed('✖'),
  high: c.red('▲'),
  warning: c.yellow('●'),
  info: c.blue('◆'),
};

// ─── Inline remediation hints ──────────────────────────────────────

const HINTS: Record<string, string> = {
  'security/hardcoded-api-key': 'Move to environment variables: process.env.API_KEY',
  'security/sql-injection': 'Use parameterized queries: db.query("...WHERE id = $1", [id])',
  'security/no-eval': 'Use JSON.parse() for data or a sandboxed evaluator',
  'security/xss-vulnerability': 'Use textContent instead of innerHTML, or sanitize with DOMPurify',
  'security/insecure-cors': 'Specify exact origins: cors({ origin: ["https://myapp.com"] })',
  'security/env-var-leak': 'Only expose vars with NEXT_PUBLIC_ or VITE_ prefix to client',
  'security/unsafe-regex': 'Avoid nested quantifiers (a+)+, use re2 for untrusted input',
  'security/no-rate-limiting': 'Add rate limiter: app.use(rateLimit({ windowMs, max }))',
  'security/no-secrets-in-logs': 'Redact sensitive fields before logging',
  'security/insecure-randomness': 'Use crypto.randomUUID() or crypto.getRandomValues()',
  'security/path-traversal': 'Resolve path and verify it starts within the base directory',
  'security/prototype-pollution': 'Use Object.create(null) or Map for dynamic keys',
  'security/jwt-misuse': 'Use jwt.verify() with env secret, never algorithm "none"',
  'security/open-redirect': 'Validate redirect URLs against an allowlist of trusted domains',
  'security/insecure-cookie': 'Set { httpOnly: true, secure: true, sameSite: "strict" }',
  'ai-codegen/hallucinated-import': 'Verify package exists: npm info <package-name>',
  'ai-codegen/placeholder-code': 'Replace TODO/placeholder with real implementation',
  'ai-codegen/hardcoded-localhost': 'Use process.env.API_URL or a config file',
  'ai-codegen/overly-broad-catch': 'Log the error and re-throw, or handle specific error types',
  'ai-codegen/unused-imports': 'Remove unused import — auto-fixable with guardrail fix',
  'ai-codegen/any-type-abuse': 'Replace "any" with a proper type or "unknown" + type guard',
  'ai-codegen/fetch-without-error-handling': 'Check response.ok and wrap in try/catch',
  'ai-codegen/promise-without-catch': 'Add .catch() or use async/await with try/catch',
  'ai-codegen/console-log-spam': 'Remove or use a proper logger — auto-fixable',
  'ai-codegen/magic-numbers': 'Extract into a named constant: const ONE_DAY_MS = 86400000',
  'ai-codegen/no-async-without-await': 'Remove the async keyword — function does not await',
  'quality/dead-code': 'Remove unreachable code after return/throw — auto-fixable',
  'quality/duplicate-logic': 'Extract shared logic into a reusable function',
  'performance/inefficient-loop': 'Use Promise.all() for parallel async, cache .length',
  'performance/n-plus-one-query': 'Batch queries with WHERE IN (...) or eager loading',
};

// ─── Box drawing helpers ───────────────────────────────────────────

function box(title: string, content: string[], borderColor: (s: string) => string = c.dim): string {
  const maxLen = Math.max(
    title.length,
    ...content.map((l) => stripAnsi(l).length),
  );
  const width = Math.max(maxLen + 4, 60);
  const pad = (s: string) => {
    const visible = stripAnsi(s).length;
    return s + ' '.repeat(Math.max(0, width - 2 - visible));
  };

  const lines: string[] = [];
  lines.push(borderColor(`  ╭${'─'.repeat(width)}╮`));
  lines.push(borderColor('  │ ') + c.bold(c.white(pad(title))) + borderColor(' │'));
  lines.push(borderColor(`  ├${'─'.repeat(width)}┤`));
  for (const line of content) {
    lines.push(borderColor('  │ ') + pad(line) + borderColor(' │'));
  }
  lines.push(borderColor(`  ╰${'─'.repeat(width)}╯`));
  return lines.join('\n');
}

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// ─── Single violation ──────────────────────────────────────────────

export function formatViolation(v: Violation, cwd: string, showHint = true, showCode = true): string {
  const relFile = relative(cwd, v.location.file);
  const loc = `${relFile}:${v.location.line}:${v.location.column}`;
  const badge = SEVERITY_BADGE[v.severity];
  const icon = SEVERITY_ICON[v.severity];
  const ruleTag = c.dim(`${v.ruleId}`);
  const fixable = v.fix ? c.brightGreen(' ⚡ fixable') : '';

  const lines = [
    `    ${icon} ${badge} ${c.white(v.message)}${fixable}`,
    `      ${c.dim('at')} ${c.underline(c.dim(loc))}  ${ruleTag}`,
  ];

  // Inline code snippet — show the problematic line
  if (showCode && (v.severity === 'critical' || v.severity === 'high')) {
    const frame = codeFrame(v, 1);
    if (frame) {
      lines.push(frame);
    }
  }

  if (showHint && HINTS[v.ruleId]) {
    lines.push(`      ${c.cyan('↳')} ${c.cyan(HINTS[v.ruleId])}`);
  }

  return lines.join('\n');
}

// ─── File result (used by watch mode) ──────────────────────────────

export function formatFileResult(result: ScanResult, cwd: string): string {
  if (result.violations.length === 0) return '';

  const relPath = relative(cwd, result.filePath);
  const lines = [
    '',
    `  ${c.bold(c.underline(c.white(relPath)))}`,
    ...result.violations.map((v) => formatViolation(v, cwd)),
  ];

  return lines.join('\n');
}

// ─── Health score ──────────────────────────────────────────────────

function calcScore(summary: ScanSummary): number {
  if (summary.totalViolations === 0) return 100;

  // Scale penalty by number of files — a 100-file project with 10 warnings
  // should score better than a 2-file project with 10 warnings
  const fileScale = Math.max(1, Math.sqrt(summary.totalFiles));

  const rawPenalty =
    summary.bySeverity.critical * 20 +
    summary.bySeverity.high * 10 +
    summary.bySeverity.warning * 2 +
    summary.bySeverity.info * 0.5;

  // Normalize: penalty per file, capped at 100
  const normalizedPenalty = Math.min(100, rawPenalty / fileScale);

  return Math.max(0, Math.round(100 - normalizedPenalty));
}

function scoreBar(score: number): string {
  const width = 24;
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;

  let colorFn: (s: string) => string;
  let grade: string;
  if (score === 100) { colorFn = c.brightGreen; grade = 'A+'; }
  else if (score >= 90) { colorFn = c.green; grade = 'A'; }
  else if (score >= 80) { colorFn = c.green; grade = 'B'; }
  else if (score >= 60) { colorFn = c.yellow; grade = 'C'; }
  else if (score >= 40) { colorFn = c.yellow; grade = 'D'; }
  else { colorFn = c.brightRed; grade = 'F'; }

  const bar = colorFn('━'.repeat(filled)) + c.dim('╌'.repeat(empty));
  return `${bar}  ${colorFn(c.bold(`${score}`))}${c.dim('/100')}  ${colorFn(c.bold(`[${grade}]`))}`;
}

// ─── Category breakdown with proportional bars ─────────────────────

function categoryBreakdown(summary: ScanSummary): string {
  const cats: Record<string, { count: number; crits: number; highs: number }> = {};
  for (const result of summary.results) {
    for (const v of result.violations) {
      const cat = v.ruleId.split('/')[0];
      if (!cats[cat]) cats[cat] = { count: 0, crits: 0, highs: 0 };
      cats[cat].count++;
      if (v.severity === 'critical') cats[cat].crits++;
      if (v.severity === 'high') cats[cat].highs++;
    }
  }

  if (Object.keys(cats).length === 0) return '';

  const catNames: Record<string, string> = {
    security: '🔒 Security',
    'ai-codegen': '🤖 AI-Codegen',
    quality: '✨ Quality',
    performance: '⚡ Performance',
  };
  const catColors: Record<string, (s: string) => string> = {
    security: c.red,
    'ai-codegen': c.magenta,
    quality: c.yellow,
    performance: c.cyan,
  };

  const maxCount = Math.max(...Object.values(cats).map((v) => v.count));
  const barWidth = 20;

  const lines: string[] = [];
  const sorted = Object.entries(cats).sort((a, b) => b[1].count - a[1].count);

  for (const [cat, data] of sorted) {
    const colorFn = catColors[cat] || c.white;
    const name = catNames[cat] || cat;
    const filled = Math.max(1, Math.round((data.count / maxCount) * barWidth));
    const bar = colorFn('█'.repeat(filled)) + c.dim('░'.repeat(barWidth - filled));
    const extra = data.crits > 0
      ? c.brightRed(` (${data.crits} crit)`)
      : data.highs > 0
        ? c.red(` (${data.highs} high)`)
        : '';
    lines.push(`    ${name.padEnd(16)} ${bar}  ${c.bold(String(data.count).padStart(3))}${extra}`);
  }

  return lines.join('\n');
}

// ─── Top offenders ─────────────────────────────────────────────────

function topOffenders(summary: ScanSummary, cwd: string): string {
  const fileCounts = new Map<string, { total: number; crits: number }>();
  for (const result of summary.results) {
    if (result.violations.length === 0) continue;
    const rel = relative(cwd, result.filePath);
    const crits = result.violations.filter((v) => v.severity === 'critical').length;
    fileCounts.set(rel, { total: result.violations.length, crits });
  }

  const sorted = [...fileCounts.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  if (sorted.length === 0) return '';

  const lines: string[] = [];
  for (const [file, data] of sorted) {
    const critTag = data.crits > 0 ? c.brightRed(` ✖ ${data.crits} critical`) : '';
    lines.push(`    ${c.dim('├──')} ${c.white(file)}  ${c.dim('—')} ${c.bold(String(data.total))} issues${critTag}`);
  }
  // Replace last ├── with └──
  if (lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace('├──', '└──');
  }
  return lines.join('\n');
}

// ─── Full summary ──────────────────────────────────────────────────

export function formatSummary(summary: ScanSummary, cwd: string, elapsed?: string): string {
  const sections: string[] = [];

  // ── Violations grouped by file, sorted by severity ──

  const filesWithIssues = summary.results.filter((r) => r.violations.length > 0);

  // Sort files: most critical issues first
  const sevWeight: Record<Severity, number> = { critical: 1000, high: 100, warning: 10, info: 1 };
  filesWithIssues.sort((a, b) => {
    const scoreA = a.violations.reduce((s, v) => s + sevWeight[v.severity], 0);
    const scoreB = b.violations.reduce((s, v) => s + sevWeight[v.severity], 0);
    return scoreB - scoreA;
  });

  if (filesWithIssues.length > 0) {
    for (const result of filesWithIssues) {
      const relPath = relative(cwd, result.filePath);
      const crits = result.violations.filter((v) => v.severity === 'critical').length;
      const highs = result.violations.filter((v) => v.severity === 'high').length;

      let fileIcon = c.green('◉');
      if (crits > 0) fileIcon = c.brightRed('◉');
      else if (highs > 0) fileIcon = c.red('◉');

      sections.push('');
      sections.push(`  ${fileIcon} ${c.bold(c.white(relPath))}  ${c.dim(`(${result.violations.length} issues)`)}`);
      sections.push(c.dim(`  ${'─'.repeat(58)}`));

      // Sort violations within file: critical first
      const sorted = [...result.violations].sort(
        (a, b) => sevWeight[b.severity] - sevWeight[a.severity],
      );

      for (const v of sorted) {
        sections.push(formatViolation(v, cwd, true));
        sections.push('');
      }
    }
  }

  // ╔══════════════════════════════════════════════════════════════════╗
  //   SUMMARY DASHBOARD
  // ╚══════════════════════════════════════════════════════════════════╝

  sections.push('');
  sections.push(c.cyan(`  ╔${'══════════════════════════════════════════════════════════'}╗`));
  sections.push(c.cyan(`  ║`) + c.bold(c.white('  SCAN RESULTS                                             ')) + c.cyan('║'));
  sections.push(c.cyan(`  ╚${'══════════════════════════════════════════════════════════'}╝`));
  sections.push('');

  if (summary.totalViolations === 0) {
    sections.push(`  ${c.brightGreen('✓')} ${c.bold(c.brightGreen('No issues found!'))} Your code is clean. ${c.dim('Ship it 🚀')}`);
    sections.push(`    Scanned ${c.bold(String(summary.totalFiles))} files${elapsed ? c.dim(` in ${elapsed}s`) : ''}`);
  } else {
    const score = calcScore(summary);

    // Health score bar
    sections.push(`  ${c.bold('Health')}        ${scoreBar(score)}`);
    sections.push('');

    // Severity counts in a visual row
    const sev = summary.bySeverity;
    const sevLine = [
      sev.critical > 0 ? c.bgRed(c.bold(c.white(` ${sev.critical} CRITICAL `))) : null,
      sev.high > 0 ? c.bgMagenta(c.bold(c.white(` ${sev.high} HIGH `))) : null,
      sev.warning > 0 ? c.bgYellow(c.bold(` ${sev.warning} WARN `)) : null,
      sev.info > 0 ? c.bgBlue(c.bold(c.white(` ${sev.info} INFO `))) : null,
    ].filter(Boolean);
    sections.push(`  ${c.bold('Issues')}        ${sevLine.join('  ')}  ${c.dim(`= ${summary.totalViolations} total`)}`);
    sections.push('');

    // Files
    sections.push(`  ${c.bold('Files')}         ${c.bold(String(summary.totalFiles))} scanned  ${c.dim('·')}  ${c.bold(String(filesWithIssues.length))} with issues${elapsed ? `  ${c.dim('·')}  ${c.dim(`${elapsed}s`)}` : ''}`);
    sections.push('');

    // Category breakdown
    const breakdown = categoryBreakdown(summary);
    if (breakdown) {
      sections.push(`  ${c.bold('Categories')}`);
      sections.push(breakdown);
      sections.push('');
    }

    // Top offenders (files with most issues)
    if (filesWithIssues.length > 1) {
      const offenders = topOffenders(summary, cwd);
      if (offenders) {
        sections.push(`  ${c.bold('Worst Files')}`);
        sections.push(offenders);
        sections.push('');
      }
    }

    // ── Action items ──
    const fixableCount = summary.results.reduce(
      (acc, r) => acc + r.violations.filter((v) => v.fix).length,
      0,
    );

    sections.push(c.cyan(`  ┌${'─'.repeat(58)}┐`));
    sections.push(c.cyan('  │') + c.bold(c.white('  WHAT TO DO NEXT                                          ')) + c.cyan('│'));
    sections.push(c.cyan(`  └${'─'.repeat(58)}┘`));
    sections.push('');

    let step = 1;

    if (sev.critical > 0) {
      sections.push(`    ${c.brightRed(c.bold(`${step}.`))} ${c.brightRed(c.bold('Fix critical vulnerabilities NOW'))} — these are exploitable`);
      sections.push(`       ${c.dim(`${sev.critical} critical issues found that attackers can exploit in production`)}`);
      step++;
    }

    if (fixableCount > 0) {
      sections.push(`    ${c.brightGreen(c.bold(`${step}.`))} ${c.brightGreen('Auto-fix')} ${c.bold(String(fixableCount))} issues instantly:`);
      sections.push(`       ${c.dim('$')} ${c.white('guardrail fix .')}${c.dim('          # applies safe AST transforms')}`);
      step++;
    }

    if (sev.high > 0) {
      sections.push(`    ${c.red(c.bold(`${step}.`))} ${c.red('Address high-severity issues')} before merging`);
      step++;
    }

    sections.push(`    ${c.cyan(c.bold(`${step}.`))} ${c.cyan('Generate a fix guide')} for your AI assistant:`);
    sections.push(`       ${c.dim('$')} ${c.white('guardrail scan . --report md')}${c.dim('  # creates GUARDRAIL-AUDIT.md')}`);
    sections.push(`       ${c.dim('Then paste GUARDRAIL-AUDIT.md into Claude or ChatGPT')}`);
    step++;

    sections.push(`    ${c.dim(`${step}.`)} ${c.dim('Other reports:')}`);
    sections.push(`       ${c.dim('$')} ${c.dim('guardrail scan . --report html')}${c.dim(' # visual HTML report')}`);
    sections.push(`       ${c.dim('$')} ${c.dim('guardrail scan . --report sarif')}${c.dim('# GitHub Code Scanning')}`);
  }

  sections.push('');
  return sections.join('\n');
}

// ─── Diff formatter ────────────────────────────────────────────────

export function formatDiff(diff: string): string {
  return diff
    .split('\n')
    .map((line) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return c.green(line);
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        return c.red(line);
      }
      if (line.startsWith('@@')) {
        return c.cyan(line);
      }
      return line;
    })
    .join('\n');
}
