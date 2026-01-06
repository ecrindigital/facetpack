import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

export const checkWithFacetpackApplied: Check = {
  name: 'with-facetpack-applied',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) return null

    const content = readFileSync(configPath, 'utf-8')

    const isApplied = /module\.exports\s*=\s*withFacetpack\s*\(/.test(content)
      || /exports\s*=\s*withFacetpack\s*\(/.test(content)

    if (isApplied) {
      return {
        label: 'withFacetpack() applied',
        status: 'success',
      }
    }

    if (content.includes('withFacetpack')) {
      return {
        label: 'withFacetpack()',
        status: 'error',
        detail: 'Imported but not applied — use module.exports = withFacetpack(config)',
      }
    }

    return {
      label: 'withFacetpack()',
      status: 'error',
      detail: 'Not found — add withFacetpack() wrapper',
    }
  },
}
