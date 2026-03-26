# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Guardrail, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainers or use GitHub's private vulnerability reporting
3. Include steps to reproduce the issue
4. Allow reasonable time for a fix before public disclosure

## Scope

Guardrail is a static analysis tool that reads and analyzes source code. Security concerns include:

- **Rule bypass**: Patterns that should be detected but aren't
- **Code execution**: Vulnerabilities in the fixer engine that could execute arbitrary code
- **Plugin system**: Issues with loading untrusted plugins
