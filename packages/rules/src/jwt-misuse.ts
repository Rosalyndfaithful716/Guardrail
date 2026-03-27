import traverse from '@babel/traverse';
import type { Rule, RuleContext, Violation } from '@guardrail-ai/core';

/**
 * Detects JWT security misuse patterns.
 *
 * Catches patterns like:
 *   jwt.verify(token, secret, { algorithms: ['none'] })
 *   jwt.decode(token)  — used without verify
 *   jwt.sign(payload, '') — empty secret
 *   jwt.sign(payload, 'hardcoded-secret')
 */

const jwtMisuseRule: Rule = {
  id: 'security/jwt-misuse',
  name: 'JWT Misuse',
  description:
    'Detects insecure JWT patterns: decode without verify, algorithm none, empty/hardcoded secrets',
  severity: 'critical',
  category: 'security',

  detect(context: RuleContext): Violation[] {
    const violations: Violation[] = [];
    const { ast, filePath } = context;

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') {
          return;
        }

        const method = callee.property.name;
        const args = path.node.arguments;

        // Only match jwt-like objects, not TextDecoder, VideoDecoder, etc.
        const objName = callee.object.type === 'Identifier' ? callee.object.name.toLowerCase() : '';
        const NON_JWT_OBJECTS = new Set(['decoder', 'textdecoder', 'audiodecoder', 'videodecoder', 'reader', 'response', 'buffer', 'stream']);
        if (NON_JWT_OBJECTS.has(objName)) return;

        // jwt.decode() — often misused as verification
        if (method === 'decode') {
          // Only flag if the object looks like a JWT library (jwt, jsonwebtoken, jwtLib, etc.)
          const isJwtLike = objName === '' || objName.includes('jwt') || objName.includes('token') || objName === 'jose';
          if (!isJwtLike) return;

          violations.push({
            ruleId: 'security/jwt-misuse',
            severity: 'high',
            message:
              'jwt.decode() does NOT verify the token signature. Use jwt.verify() to validate tokens.',
            location: {
              file: filePath,
              line: path.node.loc?.start.line ?? 0,
              column: path.node.loc?.start.column ?? 0,
            },
          });
        }

        // jwt.sign(payload, secret) or jwt.verify(token, secret, options)
        if (method === 'sign' || method === 'verify') {
          // Check for empty or hardcoded secret (2nd argument)
          if (args.length >= 2) {
            const secretArg = args[1];
            if (secretArg.type !== 'SpreadElement') {
              if (
                secretArg.type === 'StringLiteral' &&
                secretArg.value.length === 0
              ) {
                violations.push({
                  ruleId: 'security/jwt-misuse',
                  severity: 'critical',
                  message: `jwt.${method}() called with an empty secret — tokens can be forged.`,
                  location: {
                    file: filePath,
                    line: secretArg.loc?.start.line ?? 0,
                    column: secretArg.loc?.start.column ?? 0,
                  },
                });
              } else if (
                secretArg.type === 'StringLiteral' &&
                secretArg.value.length > 0
              ) {
                violations.push({
                  ruleId: 'security/jwt-misuse',
                  severity: 'high',
                  message: `jwt.${method}() called with a hardcoded secret. Use an environment variable or key management service.`,
                  location: {
                    file: filePath,
                    line: secretArg.loc?.start.line ?? 0,
                    column: secretArg.loc?.start.column ?? 0,
                  },
                });
              }
            }
          }

          // Check for { algorithms: ['none'] } in options
          const optionsArg = method === 'verify' ? args[2] : args[2];
          if (optionsArg && optionsArg.type === 'ObjectExpression') {
            for (const prop of optionsArg.properties) {
              if (
                prop.type === 'ObjectProperty' &&
                ((prop.key.type === 'Identifier' && prop.key.name === 'algorithms') ||
                  (prop.key.type === 'StringLiteral' && prop.key.value === 'algorithms'))
              ) {
                const val = prop.value;
                if (val.type === 'ArrayExpression') {
                  for (const elem of val.elements) {
                    if (
                      elem?.type === 'StringLiteral' &&
                      elem.value.toLowerCase() === 'none'
                    ) {
                      violations.push({
                        ruleId: 'security/jwt-misuse',
                        severity: 'critical',
                        message:
                          'JWT algorithm "none" allows unsigned tokens — any token will be accepted as valid.',
                        location: {
                          file: filePath,
                          line: elem.loc?.start.line ?? 0,
                          column: elem.loc?.start.column ?? 0,
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        }
      },
    });

    return violations;
  },
};

export default jwtMisuseRule;
