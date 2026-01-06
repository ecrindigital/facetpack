import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

export const checkSentryConflict: Check = {
  name: 'sentry-conflict',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) return null

    const content = readFileSync(configPath, 'utf-8')

    if (content.includes('sentry') || content.includes('Sentry')) {
      return {
        label: 'Tree-shaking: disabled',
        status: 'warning',
        detail: 'Sentry detected',
      }
    }

    return null
  },
}
