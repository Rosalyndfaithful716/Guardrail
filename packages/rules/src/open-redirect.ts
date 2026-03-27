import traverse from '@babel/traverse';
import type { Rule, RuleContext, Violation } from '@guardrail-ai/core';

/**
 * Detects open redirect vulnerabilities from unvalidated redirect URLs.
 *
 * Catches patterns like:
 *   res.redirect(req.query.url)
 *   window.location.href = userInput
 *   window.location.assign(variable)
 */

const REDIRECT_METHODS = new Set(['redirect', 'replace', 'assign']);
const USER_INPUT = /\b(req|request|params|query|body|searchParams)\b/;

function expressionToString(node: any): string {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression') {
    const obj = expressionToString(node.object);
    const prop =
      node.property.type === 'Identifier'
        ? node.property.name
        : node.property.value ?? '';
    return `${obj}.${prop}`;
  }
  return '';
}

function isUserInput(node: any): boolean {
  if (node.type === 'StringLiteral') return false;
  const str = expressionToString(node);
  return USER_INPUT.test(str);
}

const openRedirectRule: Rule = {
  id: 'security/open-redirect',
  name: 'Open Redirect',
  description:
    'Detects unvalidated redirects using user-controlled input which can be used for phishing attacks',
  severity: 'high',
  category: 'security',

  detect(context: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const { ast, filePath } = context;

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;

        // res.redirect(req.query.url)
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          REDIRECT_METHODS.has(callee.property.name)
        ) {
          const args = path.node.arguments;
          // res.redirect can take (status, url) or just (url)
          for (const arg of args) {
            if (arg.type !== 'SpreadElement' && arg.type !== 'NumericLiteral' && isUserInput(arg)) {
              violations.push({
                ruleId: 'security/open-redirect',
                severity: 'high',
                message:
                  'Redirect with user-controlled URL — open redirect risk. Validate the URL against an allowlist of domains.',
                location: {
                  file: filePath,
                  line: path.node.loc?.start.line ?? 0,
                  column: path.node.loc?.start.column ?? 0,
                },
              });
              break;
            }
          }
        }
      },

      // window.location.href = userInput  or  window.location = userInput
      AssignmentExpression(path) {
        const left = path.node.left;
        if (left.type !== 'MemberExpression') return;

        const leftStr = expressionToString(left);
        if (
          leftStr === 'window.location.href' ||
          leftStr === 'window.location' ||
          leftStr === 'document.location.href' ||
          leftStr === 'document.location'
        ) {
          const right = path.node.right;
          if (right.type !== 'StringLiteral' && isUserInput(right)) {
            violations.push({
              ruleId: 'security/open-redirect',
              severity: 'high',
              message:
                'Setting window.location with user input — open redirect risk. Validate the URL before redirecting.',
              location: {
                file: filePath,
                line: path.node.loc?.start.line ?? 0,
                column: path.node.loc?.start.column ?? 0,
              },
            });
          }
        }
      },
    });

    return violations;
  },
};

export default openRedirectRule;
