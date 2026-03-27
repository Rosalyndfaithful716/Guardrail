import { relative } from 'path';
import { writeFileSync } from 'fs';
import type { ScanSummary, Violation, ScanResult } from '@guardrail-ai/core';

/**
 * Remediation guidance for each rule.
 * This is the core value — tells AI models and developers exactly how to fix each issue.
 */
const REMEDIATION: Record<string, { title: string; why: string; fix: string; example?: string }> = {
  'security/hardcoded-api-key': {
    title: 'Hardcoded API Key / Secret',
    why: 'Hardcoded secrets get committed to version control and leaked. Attackers scan GitHub for exposed keys.',
    fix: 'Move secrets to environment variables. Use a `.env` file locally and a secrets manager (AWS Secrets Manager, Vault) in production.',
    example: `// BAD
const API_KEY = "sk-abc123...";

// GOOD
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY is required");`,
  },
  'security/sql-injection': {
    title: 'SQL Injection',
    why: 'Attackers can manipulate SQL queries to access, modify, or delete data. One of the most dangerous web vulnerabilities.',
    fix: 'Use parameterized queries (prepared statements). Never concatenate user input into SQL strings.',
    example: `// BAD
db.query("SELECT * FROM users WHERE id = " + userId);

// GOOD
db.query("SELECT * FROM users WHERE id = $1", [userId]);`,
  },
  'security/xss-vulnerability': {
    title: 'Cross-Site Scripting (XSS)',
    why: 'XSS lets attackers inject malicious scripts that run in other users\' browsers, stealing cookies, sessions, and data.',
    fix: 'Never use innerHTML with dynamic content. Use textContent for text, or sanitize with DOMPurify. In React, avoid dangerouslySetInnerHTML.',
    example: `// BAD
element.innerHTML = userInput;

// GOOD
element.textContent = userInput;
// Or with sanitization:
element.innerHTML = DOMPurify.sanitize(userInput);`,
  },
  'security/insecure-cors': {
    title: 'Insecure CORS Configuration',
    why: 'Overly permissive CORS allows any website to make requests to your API, enabling data theft.',
    fix: 'Specify exact allowed origins instead of using wildcard (*). Never reflect the Origin header without validation.',
    example: `// BAD
app.use(cors());

// GOOD
app.use(cors({ origin: ["https://myapp.com"], credentials: true }));`,
  },
  'security/no-eval': {
    title: 'eval() / new Function() Usage',
    why: 'eval executes arbitrary code, enabling code injection attacks. It also defeats static analysis and optimization.',
    fix: 'Replace eval with JSON.parse for data, or use safer alternatives like Function constructors with fixed templates.',
    example: `// BAD
const result = eval(userExpression);

// GOOD
const result = JSON.parse(jsonString);`,
  },
  'security/env-var-leak': {
    title: 'Environment Variable Leak',
    why: 'process.env values exposed to client-side code can leak secrets to users\' browsers.',
    fix: 'Only expose env vars with a public prefix (NEXT_PUBLIC_, VITE_). Keep sensitive vars server-side only.',
  },
  'security/no-rate-limiting': {
    title: 'Missing Rate Limiting',
    why: 'Without rate limiting, attackers can brute-force passwords, overwhelm your API, or scrape data at scale.',
    fix: 'Add rate limiting middleware (express-rate-limit, @nestjs/throttler). Apply stricter limits to auth endpoints.',
    example: `// GOOD
import rateLimit from 'express-rate-limit';
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));`,
  },
  'security/unsafe-regex': {
    title: 'Unsafe Regular Expression (ReDoS)',
    why: 'Certain regex patterns cause catastrophic backtracking, locking up the event loop for minutes on crafted input.',
    fix: 'Avoid nested quantifiers (e.g., (a+)+). Use re2 library for untrusted input. Add input length limits.',
  },
  'security/no-secrets-in-logs': {
    title: 'Secrets in Log Output',
    why: 'Logging secrets means they appear in log aggregators, monitoring tools, and crash reports — all less secure than secrets managers.',
    fix: 'Redact sensitive fields before logging. Use structured logging with field-level redaction.',
  },
  'security/insecure-randomness': {
    title: 'Insecure Randomness (Math.random)',
    why: 'Math.random() is predictable — it uses a PRNG that can be reverse-engineered. Never use it for tokens, keys, or IDs.',
    fix: 'Use crypto.randomUUID() for IDs, crypto.getRandomValues() for random bytes, or crypto.randomBytes() in Node.js.',
    example: `// BAD
const token = Math.random().toString(36);

// GOOD
const token = crypto.randomUUID();`,
  },
  'security/path-traversal': {
    title: 'Path Traversal',
    why: 'Attackers can use ../ sequences to access files outside the intended directory — reading /etc/passwd, config files, etc.',
    fix: 'Resolve the full path and verify it starts with the intended base directory. Never pass user input directly to fs methods.',
    example: `// BAD
fs.readFile(path.join(uploadDir, req.params.file));

// GOOD
const safePath = path.resolve(uploadDir, req.params.file);
if (!safePath.startsWith(path.resolve(uploadDir))) throw new Error("Invalid path");
fs.readFile(safePath);`,
  },
  'security/prototype-pollution': {
    title: 'Prototype Pollution',
    why: 'Attackers can inject __proto__ or constructor.prototype properties to modify all objects, leading to RCE or auth bypass.',
    fix: 'Use Object.create(null) for lookup objects. Validate keys against __proto__, constructor, prototype. Use Map instead of plain objects for user-controlled keys.',
  },
  'security/jwt-misuse': {
    title: 'JWT Security Misuse',
    why: 'Unsigned JWTs (algorithm: none), hardcoded secrets, or using decode instead of verify lets attackers forge tokens.',
    fix: 'Always use jwt.verify() (not decode). Use strong secrets from env vars. Never allow algorithm "none". Use RS256 for production.',
    example: `// BAD
const data = jwt.decode(token);
jwt.sign(payload, "my-secret");

// GOOD
const data = jwt.verify(token, process.env.JWT_SECRET);
jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "RS256" });`,
  },
  'security/open-redirect': {
    title: 'Open Redirect',
    why: 'Attackers use open redirects for phishing — victims trust your domain but get sent to a malicious site.',
    fix: 'Validate redirect URLs against an allowlist of domains. Use relative paths when possible.',
    example: `// BAD
res.redirect(req.query.returnUrl);

// GOOD
const allowed = ["https://myapp.com", "https://app.myapp.com"];
const url = new URL(req.query.returnUrl, "https://myapp.com");
if (!allowed.includes(url.origin)) throw new Error("Invalid redirect");
res.redirect(url.toString());`,
  },
  'security/insecure-cookie': {
    title: 'Insecure Cookie Configuration',
    why: 'Cookies without httpOnly can be stolen via XSS. Without secure, they\'re sent over HTTP. Without sameSite, CSRF attacks work.',
    fix: 'Set httpOnly: true, secure: true, sameSite: "strict" (or "lax") on all session/auth cookies.',
    example: `// BAD
res.cookie("session", token);

// GOOD
res.cookie("session", token, { httpOnly: true, secure: true, sameSite: "strict" });`,
  },
  'ai-codegen/hallucinated-import': {
    title: 'Hallucinated Import',
    why: 'AI models frequently generate imports for packages that don\'t exist on npm. These could be typosquatted with malicious packages.',
    fix: 'Verify every import exists: run `npm ls` or check npmjs.com. Remove or replace with a real package.',
  },
  'ai-codegen/placeholder-code': {
    title: 'Placeholder / TODO Code',
    why: 'AI often leaves TODO comments and placeholder implementations that look real but do nothing.',
    fix: 'Search for TODO, FIXME, "implement this", "add logic here" and replace with real implementations or remove.',
  },
  'ai-codegen/hardcoded-localhost': {
    title: 'Hardcoded Localhost',
    why: 'AI defaults to localhost:3000, localhost:8080, etc. These break in staging/production.',
    fix: 'Use environment variables for all URLs and ports. Use relative URLs for same-origin requests.',
    example: `// BAD
fetch("http://localhost:3000/api/users");

// GOOD
fetch(\`\${process.env.API_URL}/api/users\`);`,
  },
  'ai-codegen/overly-broad-catch': {
    title: 'Overly Broad Catch',
    why: 'catch(e) {} swallows errors silently. AI generates these as "error handling" but they hide real bugs.',
    fix: 'Log the error, re-throw it, or handle specific error types. Never silently swallow exceptions.',
    example: `// BAD
try { doWork(); } catch (e) {}

// GOOD
try { doWork(); } catch (e) {
  logger.error("doWork failed", { error: e });
  throw e;
}`,
  },
  'ai-codegen/unused-imports': {
    title: 'Unused Imports',
    why: 'AI generates imports for functions it planned to use but didn\'t. This bloats bundle size and confuses readers.',
    fix: 'Remove unused imports. Run `guardrail fix` to auto-remove them.',
  },
  'ai-codegen/any-type-abuse': {
    title: 'TypeScript "any" Type Abuse',
    why: 'AI uses `any` to avoid type errors, defeating the purpose of TypeScript. Bugs that types would catch slip through.',
    fix: 'Replace `any` with proper types. Use `unknown` when the type is truly unknown, then narrow with type guards.',
  },
  'ai-codegen/fetch-without-error-handling': {
    title: 'Fetch Without Error Handling',
    why: 'AI generates fetch() calls without checking response.ok or catching network errors. Failures are silent.',
    fix: 'Check response.ok after fetch. Wrap in try/catch for network errors.',
    example: `// BAD
const data = await fetch(url).then(r => r.json());

// GOOD
const res = await fetch(url);
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const data = await res.json();`,
  },
  'ai-codegen/promise-without-catch': {
    title: 'Promise Without .catch()',
    why: 'Unhandled promise rejections crash Node.js processes and cause silent failures in browsers.',
    fix: 'Add .catch() to every promise chain, or use try/catch with async/await.',
  },
  'ai-codegen/console-log-spam': {
    title: 'Console.log Spam',
    why: 'AI adds console.log for debugging that shouldn\'t ship to production. It leaks internal data and slows performance.',
    fix: 'Remove console.log calls. Use a proper logger (winston, pino) with log levels. Run `guardrail fix` to auto-remove.',
  },
  'ai-codegen/magic-numbers': {
    title: 'Magic Numbers',
    why: 'Unnamed numeric constants make code unreadable. AI uses numbers like 86400, 3600, 1337 without explanation.',
    fix: 'Extract magic numbers into named constants that explain their purpose.',
    example: `// BAD
setTimeout(callback, 86400000);

// GOOD
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
setTimeout(callback, ONE_DAY_MS);`,
  },
  'ai-codegen/no-async-without-await': {
    title: 'Async Function Without Await',
    why: 'AI marks functions as async unnecessarily. This adds overhead (wraps return value in Promise) and misleads readers.',
    fix: 'Remove the async keyword if the function doesn\'t use await or for-await.',
  },
  'quality/dead-code': {
    title: 'Dead / Unreachable Code',
    why: 'Code after return/throw never executes. AI generates it when refactoring or combining multiple answers.',
    fix: 'Remove unreachable statements. Run `guardrail fix` to auto-remove them.',
  },
  'quality/duplicate-logic': {
    title: 'Duplicate Logic',
    why: 'AI often copies code blocks instead of extracting functions. This creates maintenance burden and inconsistent behavior.',
    fix: 'Extract duplicated logic into a shared function. Keep a single source of truth.',
  },
  'performance/inefficient-loop': {
    title: 'Inefficient Loop',
    why: 'await inside loops runs operations sequentially. Accessing .length on every iteration wastes cycles.',
    fix: 'Use Promise.all() for parallel async work. Cache array.length before the loop.',
    example: `// BAD
for (const id of ids) { await fetch(\`/api/\${id}\`); }

// GOOD
await Promise.all(ids.map(id => fetch(\`/api/\${id}\`)));`,
  },
  'performance/n-plus-one-query': {
    title: 'N+1 Query',
    why: 'Querying inside a loop sends N separate database requests instead of 1 batch. This destroys performance at scale.',
    fix: 'Batch queries using WHERE IN (...) or use an ORM\'s eager loading (include/populate).',
    example: `// BAD
for (const user of users) { await db.query("SELECT * FROM orders WHERE user_id = $1", [user.id]); }

// GOOD
const userIds = users.map(u => u.id);
await db.query("SELECT * FROM orders WHERE user_id = ANY($1)", [userIds]);`,
  },
};

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    default: return '⚪';
  }
}

function groupViolationsByRule(results: ScanResult[]): Map<string, Violation[]> {
  const grouped = new Map<string, Violation[]>();
  for (const result of results) {
    for (const v of result.violations) {
      const existing = grouped.get(v.ruleId) ?? [];
      existing.push(v);
      grouped.set(v.ruleId, existing);
    }
  }
  return grouped;
}

export function generateMdReport(
  summary: ScanSummary,
  cwd: string,
  outputPath: string,
): void {
  const grouped = groupViolationsByRule(summary.results);
  const now = new Date().toISOString().split('T')[0];

  const lines: string[] = [];

  // Header
  lines.push('# Guardrail Audit Report');
  lines.push('');
  lines.push(`> Generated on ${now} by [Guardrail](https://github.com/Manavarya09/Guardrail) — the safety layer for AI-generated code.`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Files scanned | ${summary.totalFiles} |`);
  lines.push(`| Total issues | ${summary.totalViolations} |`);
  lines.push(`| 🔴 Critical | ${summary.bySeverity.critical} |`);
  lines.push(`| 🟠 High | ${summary.bySeverity.high} |`);
  lines.push(`| 🟡 Warning | ${summary.bySeverity.warning} |`);
  lines.push(`| 🔵 Info | ${summary.bySeverity.info} |`);
  lines.push('');

  if (summary.totalViolations === 0) {
    lines.push('**✅ No issues found! Your code is clean.**');
    lines.push('');
    writeFileSync(outputPath, lines.join('\n'));
    return;
  }

  // Score
  const score = Math.max(
    0,
    100 -
      summary.bySeverity.critical * 15 -
      summary.bySeverity.high * 8 -
      summary.bySeverity.warning * 3 -
      summary.bySeverity.info * 1,
  );
  lines.push(`## Health Score: ${score}/100`);
  lines.push('');
  if (score >= 80) lines.push('> 🟢 Good — minor issues to address.');
  else if (score >= 50) lines.push('> 🟡 Fair — several issues need attention before shipping.');
  else lines.push('> 🔴 Critical — serious vulnerabilities found. Fix before deploying.');
  lines.push('');

  // Detailed findings by rule — this is the AI-guidance section
  lines.push('---');
  lines.push('');
  lines.push('## Detailed Findings & Remediation Guide');
  lines.push('');
  lines.push('> Use this section to guide your AI assistant or development team on how to fix each issue.');
  lines.push('');

  // Sort: critical first, then high, warning, info
  const severityOrder: Record<string, number> = { critical: 0, high: 1, warning: 2, info: 3 };
  const sortedRules = [...grouped.entries()].sort((a, b) => {
    const aSev = severityOrder[a[1][0].severity] ?? 4;
    const bSev = severityOrder[b[1][0].severity] ?? 4;
    return aSev - bSev;
  });

  for (const [ruleId, violations] of sortedRules) {
    const remediation = REMEDIATION[ruleId];
    const severity = violations[0].severity;
    const emoji = getSeverityEmoji(severity);

    lines.push(`### ${emoji} ${remediation?.title ?? ruleId}`);
    lines.push('');
    lines.push(`**Rule:** \`${ruleId}\` | **Severity:** ${severity.toUpperCase()} | **Occurrences:** ${violations.length}`);
    lines.push('');

    if (remediation) {
      lines.push(`**Why this is dangerous:**`);
      lines.push(remediation.why);
      lines.push('');
      lines.push(`**How to fix:**`);
      lines.push(remediation.fix);
      lines.push('');

      if (remediation.example) {
        lines.push('**Example:**');
        lines.push('```typescript');
        lines.push(remediation.example);
        lines.push('```');
        lines.push('');
      }
    }

    // List all occurrences
    lines.push('<details>');
    lines.push(`<summary>📍 ${violations.length} location${violations.length > 1 ? 's' : ''} to fix</summary>`);
    lines.push('');
    lines.push('| File | Line | Message |');
    lines.push('|------|------|---------|');
    for (const v of violations) {
      const relPath = relative(cwd, v.location.file);
      lines.push(`| \`${relPath}\` | ${v.location.line}:${v.location.column} | ${v.message} |`);
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  // AI prompt section
  lines.push('---');
  lines.push('');
  lines.push('## AI Fix Prompt');
  lines.push('');
  lines.push('> Copy-paste this into your AI assistant (Claude, ChatGPT, Copilot) to fix all issues at once:');
  lines.push('');
  lines.push('```');
  lines.push('Fix the following security and code quality issues in my codebase.');
  lines.push('For each issue, apply the recommended fix. Do not introduce new issues.');
  lines.push('');

  for (const [ruleId, violations] of sortedRules) {
    const remediation = REMEDIATION[ruleId];
    lines.push(`## ${ruleId} (${violations.length} occurrences)`);
    if (remediation) {
      lines.push(`Fix: ${remediation.fix}`);
    }
    lines.push('Locations:');
    for (const v of violations) {
      const relPath = relative(cwd, v.location.file);
      lines.push(`  - ${relPath}:${v.location.line} — ${v.message}`);
    }
    lines.push('');
  }

  lines.push('```');
  lines.push('');

  // Auto-fixable section
  const fixableCount = summary.results.reduce(
    (acc, r) => acc + r.violations.filter((v) => v.fix).length,
    0,
  );
  if (fixableCount > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Auto-fixable Issues');
    lines.push('');
    lines.push(`**${fixableCount} issues** can be auto-fixed by running:`);
    lines.push('');
    lines.push('```bash');
    lines.push('npx @guardrail-ai/cli fix .');
    lines.push('```');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by [Guardrail](https://github.com/Manavarya09/Guardrail) — scan and fix AI-generated code.*');

  writeFileSync(outputPath, lines.join('\n'));
}
