import traverse from '@babel/traverse';
import type { Rule, RuleContext, Violation } from '@guardrail-ai/core';

/**
 * Detects prototype pollution vulnerabilities.
 *
 * Catches patterns like:
 *   obj[key] = value  (when key is dynamic)
 *   Object.assign(target, untrustedSource)
 *   _.merge(target, userInput)
 *   { ...target, ...userInput }  (spread from variable in certain contexts)
 */

const DANGEROUS_MERGE_METHODS = new Set([
  'merge',
  'mergeWith',
  'defaultsDeep',
  'extend',
  'deepExtend',
  'deepMerge',
]);

const prototypePollutionRule: Rule = {
  id: 'security/prototype-pollution',
  name: 'Prototype Pollution',
  description:
    'Detects patterns that could lead to prototype pollution via dynamic property assignment or unsafe object merging',
  severity: 'high',
  category: 'security',

  detect(context: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const { ast, filePath } = context;

    traverse(ast, {
      // obj[userInput] = value — dynamic property assignment
      AssignmentExpression(path) {
        const left = path.node.left;
        if (
          left.type === 'MemberExpression' &&
          left.computed &&
          left.property.type !== 'NumericLiteral' &&
          left.property.type !== 'StringLiteral'
        ) {
          // Check for nested dynamic access: obj[a][b] = val
          if (
            left.object.type === 'MemberExpression' &&
            left.object.computed &&
            left.object.property.type !== 'NumericLiteral' &&
            left.object.property.type !== 'StringLiteral'
          ) {
            violations.push({
              ruleId: 'security/prototype-pollution',
              severity: 'high',
              message:
                'Nested dynamic property assignment (obj[a][b] = val) is a prototype pollution risk. Validate keys against __proto__, constructor, and prototype.',
              location: {
                file: filePath,
                line: path.node.loc?.start.line ?? 0,
                column: path.node.loc?.start.column ?? 0,
              },
            });
          }
        }
      },

      // Object.assign(target, source) or _.merge(target, source)
      CallExpression(path) {
        const callee = path.node.callee;

        if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
          const methodName = callee.property.name;

          // Object.assign with non-literal target
          if (
            methodName === 'assign' &&
            callee.object.type === 'Identifier' &&
            callee.object.name === 'Object' &&
            path.node.arguments.length >= 2
          ) {
            const target = path.node.arguments[0];
            if (target.type !== 'SpreadElement' && target.type !== 'ObjectExpression') {
              violations.push({
                ruleId: 'security/prototype-pollution',
                severity: 'warning',
                message:
                  'Object.assign() with a non-literal target can lead to prototype pollution if the source is user-controlled. Use Object.create(null) as target or validate source keys.',
                location: {
                  file: filePath,
                  line: path.node.loc?.start.line ?? 0,
                  column: path.node.loc?.start.column ?? 0,
                },
              });
            }
            return; // Don't also check merge methods for Object.assign
          }

          // _.merge, _.defaultsDeep, etc.
          if (DANGEROUS_MERGE_METHODS.has(methodName) && path.node.arguments.length >= 2) {
            violations.push({
              ruleId: 'security/prototype-pollution',
              severity: 'high',
              message: `${methodName}() performs deep merging which can lead to prototype pollution. Use a safe merge utility or validate input keys.`,
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

export default prototypePollutionRule;
