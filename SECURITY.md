# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Facetpack, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please send an email to: **hello@ecrin.digital**

Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: Next release

## Security Best Practices

When using Facetpack in your project:

1. **Keep dependencies updated** - Run `npm audit` regularly
2. **Use lockfiles** - Commit your `package-lock.json` or `bun.lockb`
3. **Review configuration** - Avoid exposing sensitive paths in Metro config

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who report valid vulnerabilities.
