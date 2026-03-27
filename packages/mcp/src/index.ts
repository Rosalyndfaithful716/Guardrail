#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { GuardrailEngine, getChangedFiles, loadConfig } from '@guardrail-ai/core';
import { builtinRules } from '@guardrail-ai/rules';
import { FixerEngine } from '@guardrail-ai/fixer';

const server = new McpServer({
  name: 'guardrail',
  version: '0.1.0',
});

// ── Tool: scan ──────────────────────────────────────────────────────────────

server.tool(
  'guardrail_scan',
  'Scan a directory or file for security issues, performance problems, bad patterns, and AI-generated code anti-patterns. Returns structured violations with file, line, severity, and rule ID.',
  {
    target: z.string().describe('Path to a file or directory to scan'),
    severity: z
      .enum(['critical', 'high', 'warning', 'info'])
      .optional()
      .describe('Minimum severity threshold (default: info)'),
  },
  async ({ target, severity }) => {
    const engine = new GuardrailEngine({
      severityThreshold: severity ?? 'info',
    });
    engine.registerRules(builtinRules);

    const summary = await engine.scan(target);

    const lines: string[] = [];
    lines.push(
      `Scanned ${summary.totalFiles} files. Found ${summary.totalViolations} issues.`,
    );
    lines.push(
      `  Critical: ${summary.bySeverity.critical}, High: ${summary.bySeverity.high}, Warning: ${summary.bySeverity.warning}, Info: ${summary.bySeverity.info}`,
    );
    lines.push('');

    for (const result of summary.results) {
      if (result.violations.length === 0) continue;
      lines.push(`${result.filePath}:`);
      for (const v of result.violations) {
        const fix = v.fix ? ' (fixable)' : '';
        lines.push(
          `  ${v.severity.toUpperCase()} ${v.location.line}:${v.location.column} ${v.message} [${v.ruleId}]${fix}`,
        );
      }
      lines.push('');
    }

    return {
      content: [{ type: 'text' as const, text: lines.join('\n') }],
    };
  },
);

// ── Tool: fix ───────────────────────────────────────────────────────────────

server.tool(
  'guardrail_fix',
  'Auto-fix detected issues in a directory or file using AST transformations. Returns diffs of applied changes.',
  {
    target: z.string().describe('Path to a file or directory to fix'),
    dryRun: z
      .boolean()
      .optional()
      .describe('If true, show diffs without applying changes (default: true)'),
  },
  async ({ target, dryRun = true }) => {
    const engine = new GuardrailEngine();
    engine.registerRules(builtinRules);

    const summary = await engine.scan(target);
    const fixer = new FixerEngine();
    const lines: string[] = [];
    let totalFixed = 0;

    for (const result of summary.results) {
      const fixable = result.violations.filter((v) => v.fix);
      if (fixable.length === 0) continue;

      const fixResult = await fixer.applyFixes(
        result.filePath,
        result.violations,
        !dryRun,
      );

      if (fixResult.applied > 0) {
        totalFixed += fixResult.applied;
        if (fixResult.diff) {
          lines.push(fixResult.diff);
        }
      }
    }

    if (totalFixed === 0) {
      lines.push('No auto-fixable issues found.');
    } else {
      const action = dryRun ? 'would fix' : 'fixed';
      lines.push(`\n${totalFixed} issues ${action}.`);
    }

    return {
      content: [{ type: 'text' as const, text: lines.join('\n') }],
    };
  },
);

// ── Tool: list-rules ────────────────────────────────────────────────────────

server.tool(
  'guardrail_list_rules',
  'List all available Guardrail detection rules with their IDs, categories, and severities.',
  {},
  async () => {
    const lines = builtinRules.map(
      (r) => `${r.id} | ${r.category} | ${r.severity} | ${r.description}`,
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: `ID | Category | Severity | Description\n${'-'.repeat(80)}\n${lines.join('\n')}`,
        },
      ],
    };
  },
);

// ── Tool: diff ──────────────────────────────────────────────────────────────

server.tool(
  'guardrail_diff',
  'Scan only git-changed files for issues. Useful for reviewing just your recent changes.',
  {
    target: z.string().describe('Working directory path'),
    base: z.string().optional().describe('Git base ref to diff against (default: HEAD)'),
    severity: z
      .enum(['critical', 'high', 'warning', 'info'])
      .optional()
      .describe('Minimum severity threshold (default: info)'),
  },
  async ({ target, base = 'HEAD', severity }) => {
    const changedFiles = getChangedFiles(target, base);

    if (changedFiles.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No changed JS/TS files found.' }],
      };
    }

    const engine = new GuardrailEngine({
      severityThreshold: severity ?? 'info',
    });
    engine.registerRules(builtinRules);

    const results = await Promise.all(changedFiles.map((f) => engine.scanFile(f)));

    const lines: string[] = [];
    let total = 0;
    for (const result of results) {
      if (result.violations.length === 0) continue;
      lines.push(`${result.filePath}:`);
      for (const v of result.violations) {
        total++;
        const fix = v.fix ? ' (fixable)' : '';
        lines.push(
          `  ${v.severity.toUpperCase()} ${v.location.line}:${v.location.column} ${v.message} [${v.ruleId}]${fix}`,
        );
      }
      lines.push('');
    }

    lines.unshift(
      `Scanned ${changedFiles.length} changed files (base: ${base}). Found ${total} issues.\n`,
    );

    return {
      content: [{ type: 'text' as const, text: lines.join('\n') }],
    };
  },
);

// ── Tool: baseline-status ───────────────────────────────────────────────────

server.tool(
  'guardrail_baseline_status',
  'Show baseline information — how many issues are suppressed and when the baseline was created.',
  {
    target: z.string().describe('Working directory path to check for baseline'),
  },
  async ({ target }) => {
    const { existsSync, readFileSync } = await import('fs');
    const { join } = await import('path');
    const baselinePath = join(target, '.guardrail-baseline.json');

    if (!existsSync(baselinePath)) {
      return {
        content: [{ type: 'text' as const, text: 'No baseline found. Run `guardrail baseline create` to create one.' }],
      };
    }

    try {
      const raw = readFileSync(baselinePath, 'utf-8');
      const baseline = JSON.parse(raw);
      const count = baseline.issues?.length ?? 0;
      const created = baseline.createdAt ?? 'unknown';

      return {
        content: [{
          type: 'text' as const,
          text: `Baseline found:\n  Created: ${created}\n  Suppressed issues: ${count}\n  Path: ${baselinePath}`,
        }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error reading baseline: ${err instanceof Error ? err.message : err}` }],
      };
    }
  },
);

// ── Tool: config ────────────────────────────────────────────────────────────

server.tool(
  'guardrail_config',
  'Show the current Guardrail configuration for a directory, including active rules, plugins, and severity threshold.',
  {
    target: z.string().describe('Directory path to load config from'),
  },
  async ({ target }) => {
    const config = loadConfig(target);

    const lines: string[] = [];
    lines.push('Current Guardrail configuration:');
    lines.push(`  Severity threshold: ${config.severityThreshold ?? 'info'}`);
    lines.push(`  Include patterns: ${config.include.join(', ')}`);
    lines.push(`  Exclude patterns: ${config.exclude.join(', ')}`);

    if (config.plugins && config.plugins.length > 0) {
      lines.push(`  Plugins: ${config.plugins.join(', ')}`);
    } else {
      lines.push('  Plugins: none');
    }

    const ruleOverrides = Object.entries(config.rules);
    if (ruleOverrides.length > 0) {
      lines.push('  Rule overrides:');
      for (const [id, value] of ruleOverrides) {
        if (typeof value === 'boolean') {
          lines.push(`    ${id}: ${value ? 'enabled' : 'disabled'}`);
        } else {
          lines.push(`    ${id}: enabled=${value.enabled}, severity=${value.severity ?? 'default'}`);
        }
      }
    } else {
      lines.push('  Rule overrides: none (all rules at default)');
    }

    return {
      content: [{ type: 'text' as const, text: lines.join('\n') }],
    };
  },
);

// ── Tool: explain-rule ──────────────────────────────────────────────────────

server.tool(
  'guardrail_explain_rule',
  'Explain a specific Guardrail rule — what it detects, its severity, category, and whether it has auto-fix.',
  {
    ruleId: z.string().describe('The rule ID (e.g., "security/sql-injection" or "ai-codegen/console-log-spam")'),
  },
  async ({ ruleId }) => {
    const rule = builtinRules.find((r) => r.id === ruleId);

    if (!rule) {
      const suggestions = builtinRules
        .filter((r) => r.id.includes(ruleId) || ruleId.includes(r.id.split('/').pop() ?? ''))
        .map((r) => r.id)
        .slice(0, 5);

      let text = `Rule "${ruleId}" not found.`;
      if (suggestions.length > 0) {
        text += `\n\nDid you mean:\n${suggestions.map((s) => `  - ${s}`).join('\n')}`;
      }
      text += `\n\nUse guardrail_list_rules to see all available rules.`;
      return { content: [{ type: 'text' as const, text }] };
    }

    const lines = [
      `Rule: ${rule.id}`,
      `Name: ${rule.name}`,
      `Category: ${rule.category}`,
      `Severity: ${rule.severity}`,
      `Description: ${rule.description}`,
      '',
      `To suppress this rule inline:`,
      `  // guardrail-ignore ${rule.id}`,
      `  // guardrail-ignore-next-line ${rule.id}`,
      '',
      `To disable in config:`,
      `  { "rules": { "${rule.id}": false } }`,
    ];

    return {
      content: [{ type: 'text' as const, text: lines.join('\n') }],
    };
  },
);

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
