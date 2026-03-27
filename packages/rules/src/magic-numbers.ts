import traverse from '@babel/traverse';
import type { Rule, RuleContext, Violation } from '@guardrail-ai/core';

// Common numbers that don't need named constants
const ALLOWED_NUMBERS = new Set([
  // Basics
  0, 1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12,
  // Powers / common sizes
  16, 20, 24, 25, 32, 48, 50, 64, 80, 100, 128, 200, 256, 500, 512, 1000, 1024,
  // Time (ms, seconds, minutes)
  60, 1000, 3600, 86400, 60000, 3600000, 86400000,
  // Common fractions / percents
  0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 0.95, 0.99,
  // HTTP status codes
  200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503,
  // Ports
  80, 443, 3000, 3001, 5000, 8000, 8080, 8443,
]);

const magicNumbersRule: Rule = {
  id: 'ai-codegen/magic-numbers',
  name: 'Magic Numbers',
  description:
    'Detects unnamed numeric literals in logic that should be extracted to named constants',
  severity: 'info',
  category: 'ai-codegen',

  detect(context: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const { ast, filePath } = context;

    traverse(ast, {
      NumericLiteral(path) {
        const value = path.node.value;
        if (ALLOWED_NUMBERS.has(value)) return;

        // Skip integers that are small UI values (padding, margins, sizes)
        if (Number.isInteger(value) && value >= 0 && value <= 100) return;

        // Skip if it's in a variable declaration (it IS being named)
        if (path.parent.type === 'VariableDeclarator') return;

        // Skip array indices
        if (path.parent.type === 'MemberExpression' && path.parent.computed) return;

        // Skip default parameter values
        if (path.parent.type === 'AssignmentPattern') return;

        // Skip object property values (config objects, style objects)
        if (path.parent.type === 'ObjectProperty') return;

        // Skip return statements
        if (path.parent.type === 'ReturnStatement') return;

        // Skip JSX expression containers (JSX attribute values like width={300})
        if (path.parent.type === 'JSXExpressionContainer') return;

        // Skip array elements (often data arrays, coordinates, etc.)
        if (path.parent.type === 'ArrayExpression') return;

        // Skip template literal expressions
        if (path.parent.type === 'TemplateLiteral') return;

        // Skip unary expressions (like -5)
        if (path.parent.type === 'UnaryExpression') return;

        // Skip ternary/conditional expressions
        if (path.parent.type === 'ConditionalExpression') return;

        // Skip comparisons (value > 1000, index < 50, etc.)
        if (path.parent.type === 'BinaryExpression') {
          const op = (path.parent as any).operator;
          if (['<', '>', '<=', '>=', '===', '!==', '==', '!='].includes(op)) return;
        }

        // Skip call expression arguments (setTimeout(fn, 300), etc.)
        if (path.parent.type === 'CallExpression') return;

        violations.push({
          ruleId: 'ai-codegen/magic-numbers',
          severity: 'info',
          message: `Magic number ${value} — extract to a named constant for readability.`,
          location: {
            file: filePath,
            line: path.node.loc?.start.line ?? 0,
            column: path.node.loc?.start.column ?? 0,
          },
        });
      },
    });

    return violations;
  },
};

export default magicNumbersRule;
