import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

export const checkMetroConfigExists: Check = {
  name: 'metro-config-exists',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (existsSync(configPath)) {
      return {
        label: 'metro.config.js found',
        status: 'success',
      }
    }

    return {
      label: 'metro.config.js',
      status: 'error',
      detail: 'Not found',
    }
  },
}
