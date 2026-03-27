<div align="center">

# Guardrail

**The safety layer for AI-generated code.**

Scan and fix security issues, performance problems, bad patterns, and AI-specific anti-patterns -- before they ship.

[![CI](https://github.com/Manavarya09/Guardrail/actions/workflows/ci.yml/badge.svg)](https://github.com/Manavarya09/Guardrail/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@guardrail-ai/cli.svg)](https://www.npmjs.com/package/@guardrail-ai/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Guardrail-blue?logo=github)](https://github.com/marketplace/actions/guardrail-code-scanner)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

```bash
npx @guardrail-ai/cli scan .
```

```
   ____                     _           _ _
  / ___|_   _  __ _ _ __ __| |_ __ __ _(_) |
 | |  _| | | |/ _` | '__/ _` | '__/ _` | | |
 | |_| | |_| | (_| | | | (_| | | | (_| | | |
  \____|\__,_|\__,_|_|  \__,_|_|  \__,_|_|_|

  The safety layer for AI-generated code.

  Target     ./src
  Rules      30 rules across 4 categories
  Files      12 files to scan
  Engine     AST-powered (Babel parser)

  ◉ src/api/auth.ts  (6 issues)
  ──────────────────────────────────────────────
    ✖  CRIT  Potential SQL injection
      at src/api/auth.ts:18:18  security/sql-injection
        17 │ function getUser(db, userId) {
      > 18 │   return db.query("SELECT * FROM users WHERE id = " + userId);
           │                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        19 │ }
      ↳ Use parameterized queries: db.query("...WHERE id = $1", [id])

  ╔══════════════════════════════════════════════╗
  ║  SCAN RESULTS                                ║
  ╚══════════════════════════════════════════════╝

  Health        ━━━━━━━━━━━━━━╌╌╌╌╌╌╌╌╌╌  62/100  [C]
  Issues         2 CRITICAL   3 HIGH   4 WARN  = 9 total
  Categories
    🔒 Security      █████████████  5  (2 crit)
    🤖 AI-Codegen    ████████       3
    ⚡ Performance    ██             1

  ┌──────────────────────────────────────────────┐
  │  WHAT TO DO NEXT                              │
  └──────────────────────────────────────────────┘

    1. Fix critical vulnerabilities NOW
    2. Auto-fix 3 issues: guardrail fix .
    3. Generate fix guide: guardrail scan . --report md
```

---

## Why Guardrail?

AI code generators (Copilot, ChatGPT, Claude) are fast -- but they produce patterns that traditional linters miss.

| Feature | ESLint | SonarQube | Snyk | **Guardrail** |
|---------|--------|-----------|------|---------------|
| Hardcoded secrets | Plugin | Yes | No | **Yes** |
| SQL injection | No | Yes | No | **Yes** |
| XSS detection | Plugin | Yes | No | **Yes** |
| JWT misuse | No | No | No | **Yes** |
| Path traversal | No | Yes | No | **Yes** |
| Prototype pollution | No | No | No | **Yes** |
| AI-hallucinated imports | No | No | No | **Yes** |
| Placeholder/TODO detection | No | Partial | No | **Yes** |
| Async without await | No | No | No | **Yes** |
| N+1 query detection | No | No | No | **Yes** |
| Inline code frames | No | No | No | **Yes** |
| AI remediation report | No | No | No | **Yes** |
| Baseline/gradual adoption | No | No | No | **Yes** |
| Git diff scanning | No | No | No | **Yes** |
| Pre-commit hook | Plugin | No | No | **Built-in** |
| Inline suppression | Yes | Yes | No | **Yes** |
| SARIF output | Plugin | Yes | Yes | **Yes** |
| AST-based auto-fix | No | No | No | **Yes** |
| Zero config | No | No | Yes | **Yes** |
| < 1s scan time | No | No | N/A | **Yes** |

---

## Quick Start

```bash
# Install globally
npm install -g @guardrail-ai/cli

# Or run directly with npx
npx @guardrail-ai/cli scan ./src

# Auto-fix issues
guardrail fix ./src

# Dry-run fixes (show diffs without applying)
guardrail fix ./src --dry-run
```

---

## 7 Commands

```bash
guardrail scan .                     # Scan for issues
guardrail fix .                      # Auto-fix issues
guardrail diff main                  # Scan only git-changed files (PR workflow)
guardrail watch .                    # Real-time scanning on file changes
guardrail hook install               # Add pre-commit git hook
guardrail baseline create            # Snapshot issues for gradual adoption
guardrail init                       # Initialize config file
```

### Reports

```bash
guardrail scan . --report md         # AI-guided fix report (for Claude/ChatGPT)
guardrail scan . --report html       # Visual HTML report
guardrail scan . --report sarif      # GitHub Code Scanning format
guardrail scan . --report html,md    # Multiple formats at once
guardrail scan . --json              # Machine-readable JSON
```

### Inline Suppression

```javascript
// guardrail-ignore-next-line
eval(trustedCode);

// guardrail-ignore-next-line security/sql-injection
db.query(`SELECT * FROM ${safeTable}`);

const key = process.env.KEY; // guardrail-ignore
```

### Gradual Adoption (Baseline)

```bash
guardrail baseline create   # Snapshot all current issues
guardrail scan .             # Now only reports NEW issues
guardrail baseline status    # See suppressed count
guardrail baseline clear     # Enforce all rules again
```

### Pre-commit Hook

```bash
guardrail hook install       # Blocks commits with critical/high issues
guardrail hook uninstall     # Remove the hook
```

### Diff Scanning (PR Workflow)

```bash
guardrail diff main          # Only scan files changed vs main
guardrail diff HEAD~3        # Last 3 commits
guardrail diff               # Staged + unstaged changes
```

---

## 30 Built-in Rules

### Security (15 rules)

| Rule | ID | Severity | Auto-fix |
|------|----|----------|----------|
| Hardcoded API Key | `security/hardcoded-api-key` | critical | No |
| SQL Injection | `security/sql-injection` | critical | No |
| No Eval | `security/no-eval` | critical | No |
| XSS Vulnerability | `security/xss-vulnerability` | critical | No |
| Path Traversal | `security/path-traversal` | critical | No |
| JWT Misuse | `security/jwt-misuse` | critical | No |
| Insecure CORS | `security/insecure-cors` | high | No |
| Environment Variable Leak | `security/env-var-leak` | high | No |
| Unsafe Regex (ReDoS) | `security/unsafe-regex` | high | No |
| No Secrets in Logs | `security/no-secrets-in-logs` | high | No |
| Prototype Pollution | `security/prototype-pollution` | high | No |
| Open Redirect | `security/open-redirect` | high | No |
| Insecure Cookie | `security/insecure-cookie` | high | No |
| Insecure Randomness | `security/insecure-randomness` | high | No |
| No Rate Limiting | `security/no-rate-limiting` | info | No |

### AI-Codegen (11 rules) -- unique to Guardrail

| Rule | ID | Severity | Auto-fix |
|------|----|----------|----------|
| Hallucinated Import | `ai-codegen/hallucinated-import` | high | No |
| Placeholder Code | `ai-codegen/placeholder-code` | warning | No |
| Hardcoded Localhost | `ai-codegen/hardcoded-localhost` | warning | No |
| Overly Broad Catch | `ai-codegen/overly-broad-catch` | warning | No |
| Unused Imports | `ai-codegen/unused-imports` | warning | Yes |
| Any Type Abuse | `ai-codegen/any-type-abuse` | warning | No |
| Fetch Without Error Handling | `ai-codegen/fetch-without-error-handling` | warning | No |
| Promise Without Catch | `ai-codegen/promise-without-catch` | warning | No |
| No Async Without Await | `ai-codegen/no-async-without-await` | warning | No |
| Console Log Spam | `ai-codegen/console-log-spam` | info | Yes |
| Magic Numbers | `ai-codegen/magic-numbers` | info | No |

### Quality (2 rules)

| Rule | ID | Severity | Auto-fix |
|------|----|----------|----------|
| Dead Code | `quality/dead-code` | warning | Yes |
| Duplicate Logic | `quality/duplicate-logic` | warning | No |

### Performance (2 rules)

| Rule | ID | Severity | Auto-fix |
|------|----|----------|----------|
| Inefficient Loop | `performance/inefficient-loop` | warning | Yes |
| N+1 Query | `performance/n-plus-one-query` | high | No |

---

## GitHub Action

```yaml
- uses: Manavarya09/Guardrail@v0.1.0
  with:
    target: './src'
    severity: 'warning'
    fail-on: 'high'
    report: 'html'
```

Issues appear as PR annotations with file and line context.

---

## Claude Code Plugin (MCP)

```json
{
  "mcpServers": {
    "guardrail": {
      "command": "npx",
      "args": ["@guardrail-ai/mcp"]
    }
  }
}
```

Tools: `guardrail_scan`, `guardrail_fix`, `guardrail_list_rules`.

---

## Configuration

```json
{
  "include": ["src/**/*.{js,jsx,ts,tsx}"],
  "exclude": ["**/*.test.ts"],
  "severityThreshold": "warning",
  "rules": {
    "ai-codegen/magic-numbers": false,
    "security/hardcoded-api-key": { "enabled": true, "severity": "critical" }
  }
}
```

Also supports `.guardrailrc`, `.guardrailrc.yaml`, `guardrail.config.js`, and `package.json` `"guardrail"` key.

---

## Architecture

```
packages/
  core/       Rule engine, AST parser, file discovery, caching, inline suppression
  rules/      30 built-in rules across 4 categories
  fixer/      AST-based auto-fix engine with unified diff output
  cli/        7 commands, 3 report formats, code frames, baseline, hooks
  mcp/        Model Context Protocol server (Claude Code plugin)
```

---

## Development

```bash
git clone https://github.com/Manavarya09/Guardrail.git
cd Guardrail
npm install
npm run build
npm test          # 139 tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the rule authoring guide.

---

## License

[MIT](LICENSE)
