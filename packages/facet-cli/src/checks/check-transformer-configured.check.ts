import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

/**
 * Checks whether the Facetpack transformer is applied in Metro configuration.
 *
 * @remarks
 * This check inspects `metro.config.js` to verify that the configuration
 * is wrapped using `withFacetpack(...)`.
 *
 * If Facetpack is correctly applied, it ensures that the custom
 * transformer pipeline is active, enabling faster transforms
 * and optimized builds.
 *
 * If Facetpack is not applied, this check silently returns `null`
 * so that it does not produce noise for projects not using Metro.
 *
 * @category Metro
 */
export const checkTransformerConfigured: Check = {
  name: 'transformer-configured',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) return null

    const content = readFileSync(configPath, 'utf-8')

    const isApplied = /module\.exports\s*=\s*withFacetpack\s*\(/.test(content)
      || /exports\s*=\s*withFacetpack\s*\(/.test(content)

    if (!isApplied) return null

    return {
      label: 'Transformer: facetpack',
      status: 'success',
    }
  },
}
