import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, message: 'eval() usage detected' },
  { pattern: /require\s*\(\s*['"`]child_process/, message: 'child_process import detected' },
  { pattern: /process\.exit/, message: 'process.exit() detected' },
]

/**
 * Validates the `metro.config.js` file for syntax errors and unsafe patterns.
 *
 * @remarks
 * Detects common dangerous patterns like `eval()`, `child_process` imports, and `process.exit()` calls.
 *
 * @why
 * Invalid or unsafe Metro config can break the bundler or introduce runtime issues.
 *
 * @failure
 * - Returns `error` if the config has invalid JavaScript syntax.
 * - Returns `warning` if dangerous patterns are detected.
 *
 * @fix
 * - Correct syntax errors in `metro.config.js`.
 * - Remove or replace any dangerous patterns in the config.
 *
 * @category Metro
 */
export const checkMetroConfigValid: Check = {
  name: 'metro-config-valid',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) return null

    const content = readFileSync(configPath, 'utf-8')

    try {
      new Function(content)
    } catch (e) {
      return {
        label: 'metro.config.js syntax',
        status: 'error',
        detail: 'Invalid JavaScript syntax',
      }
    }

    for (const { pattern, message } of DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        return {
          label: 'metro.config.js',
          status: 'warning',
          detail: message,
        }
      }
    }

    return {
      label: 'metro.config.js valid',
      status: 'success',
    }
  },
}
