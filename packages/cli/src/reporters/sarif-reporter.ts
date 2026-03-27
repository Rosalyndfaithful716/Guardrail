import { relative } from 'path';
import { writeFileSync } from 'fs';
import type { ScanSummary, Severity } from '@guardrail-ai/core';

/**
 * Generates a SARIF 2.1.0 report for GitHub Code Scanning integration.
 * https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
 */

const SEVERITY_TO_SARIF: Record<Severity, string> = {
  critical: 'error',
  high: 'error',
  warning: 'warning',
  info: 'note',
};

const SEVERITY_TO_SECURITY: Record<Severity, string> = {
  critical: '9.0',
  high: '7.0',
  warning: '4.0',
  info: '1.0',
};

export function generateSarifReport(
  summary: ScanSummary,
  cwd: string,
  outputPath: string,
): void {
  // Collect unique rules
  const ruleIds = new Set<string>();
  for (const result of summary.results) {
    for (const v of result.violations) {
      ruleIds.add(v.ruleId);
    }
  }

  const rules = [...ruleIds].map((id) => ({
    id,
    shortDescription: { text: id.replace(/\//g, ': ').replace(/-/g, ' ') },
    defaultConfiguration: {
      level: 'warning',
    },
    properties: {
      tags: [id.split('/')[0]],
    },
  }));

  const ruleIndex = new Map<string, number>();
  rules.forEach((r, i) => ruleIndex.set(r.id, i));

  const results = [];
  for (const scanResult of summary.results) {
    for (const v of scanResult.violations) {
      results.push({
        ruleId: v.ruleId,
        ruleIndex: ruleIndex.get(v.ruleId) ?? 0,
        level: SEVERITY_TO_SARIF[v.severity],
        message: { text: v.message },
        locations: [
          {
            physicalLocation: {
              artifactLocation: {
                uri: relative(cwd, v.location.file),
                uriBaseId: '%SRCROOT%',
              },
              region: {
                startLine: v.location.line,
                startColumn: v.location.column + 1, // SARIF is 1-indexed
                endLine: v.location.endLine ?? v.location.line,
                endColumn: (v.location.endColumn ?? v.location.column) + 1,
              },
            },
          },
        ],
        properties: {
          'security-severity': SEVERITY_TO_SECURITY[v.severity],
        },
      });
    }
  }

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Guardrail',
            semanticVersion: '0.1.1',
            informationUri: 'https://github.com/Manavarya09/Guardrail',
            rules,
          },
        },
        results,
      },
    ],
  };

  writeFileSync(outputPath, JSON.stringify(sarif, null, 2));
}
