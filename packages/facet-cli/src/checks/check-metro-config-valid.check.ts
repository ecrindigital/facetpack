import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, message: 'eval() usage detected' },
  { pattern: /require\s*\(\s*['"`]child_process/, message: 'child_process import detected' },
  { pattern: /process\.exit/, message: 'process.exit() detected' },
]

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
