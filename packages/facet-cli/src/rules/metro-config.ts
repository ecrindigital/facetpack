import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Rule } from './types'

export const metroConfig: Rule = {
  name: 'metro-config',
  description: 'Check Metro configuration',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) {
      return {
        message: 'metro.config.js not found',
        severity: 'error',
      }
    }

    const content = readFileSync(configPath, 'utf-8')

    if (!content.includes('withFacetpack')) {
      return {
        message: 'metro.config.js is not using withFacetpack',
        severity: 'warning',
      }
    }

    return null
  },
}
