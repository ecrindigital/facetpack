import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

export const checkResolverConfigured: Check = {
  name: 'resolver-configured',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) return null

    const content = readFileSync(configPath, 'utf-8')

    const isApplied = /module\.exports\s*=\s*withFacetpack\s*\(/.test(content)
      || /exports\s*=\s*withFacetpack\s*\(/.test(content)

    if (!isApplied) return null

    return {
      label: 'Resolver: facetpack',
      status: 'success',
    }
  },
}
