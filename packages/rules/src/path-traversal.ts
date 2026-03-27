import traverse from '@babel/traverse';
import type { Rule, RuleContext, Violation } from '@guardrail-ai/core';

/**
 * Detects path traversal vulnerabilities from unsanitized file path construction.
 *
 * Catches patterns like:
 *   fs.readFile(req.params.filename)
 *   path.join(baseDir, userInput)
 *   fs.readFile(`./uploads/${req.body.name}`)
 */

const FS_METHODS = new Set([
  'readFile',
  'readFileSync',
  'writeFile',
  'writeFileSync',
  'readdir',
  'readdirSync',
  'unlink',
  'unlinkSync',
  'stat',
  'statSync',
  'access',
  'accessSync',
  'createReadStream',
  'createWriteStream',
  'appendFile',
  'appendFileSync',
  'rm',
  'rmSync',
  'rename',
  'renameSync',
  'copyFile',
  'copyFileSync',
]);

const USER_INPUT_PATTERNS = /\b(req|request|params|query|body|headers|ctx)\b/;

function isUserInputExpression(node: any): boolean {
  // req.params.x, req.body.x, req.query.x
  if (node.type === 'MemberExpression') {
    const source = expressionToString(node);
    return USER_INPUT_PATTERNS.test(source);
  }
  // Template literal with user input
  if (node.type === 'TemplateLiteral') {
    return node.expressions.some((expr: any) => isUserInputExpression(expr));
  }
  // String concatenation
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return isUserInputExpression(node.left) || isUserInputExpression(node.right);
  }
  return false;
}

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

const pathTraversalRule: Rule = {
  id: 'security/path-traversal',
  name: 'Path Traversal',
  description:
    'Detects potential path traversal vulnerabilities from unsanitized user input in file system operations',
  severity: 'critical',
  category: 'security',

  detect(context: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const { ast, filePath } = context;

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;

        // fs.readFile(...), fs.writeFile(...), etc.
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          FS_METHODS.has(callee.property.name)
        ) {
          const args = path.node.arguments;
          if (args.length === 0) return;

          const firstArg = args[0];
          if (firstArg.type === 'SpreadElement') return;

          if (isUserInputExpression(firstArg)) {
            violations.push({
              ruleId: 'security/path-traversal',
              severity: 'critical',
              message:
                'File path includes unsanitized user input — path traversal risk. Validate and sanitize the path, use path.resolve() with a base directory check.',
              location: {
                file: filePath,
                line: firstArg.loc?.start.line ?? 0,
                column: firstArg.loc?.start.column ?? 0,
              },
            });
          }
        }

        // path.join(base, userInput) — check second+ args
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          (callee.property.name === 'join' || callee.property.name === 'resolve') &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'path'
        ) {
          const args = path.node.arguments;
          for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg.type !== 'SpreadElement' && isUserInputExpression(arg)) {
              violations.push({
                ruleId: 'security/path-traversal',
                severity: 'high',
                message:
                  'User input in path construction — path traversal risk. Sanitize input and verify the resolved path stays within the intended directory.',
                location: {
                  file: filePath,
                  line: arg.loc?.start.line ?? 0,
                  column: arg.loc?.start.column ?? 0,
                },
              });
            }
          }
        }
      },
    });

    return violations;
  },
};

export default pathTraversalRule;
