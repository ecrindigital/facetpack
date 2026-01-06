import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

/**
 * Checks whether the Metro resolver is configured using `withFacetpack`.
 *
 * @remarks
 * This check inspects the `metro.config.js` file and looks for
 * patterns indicating that the configuration is wrapped with
 * `withFacetpack(...)`.
 *
 * It supports both CommonJS export styles:
 * - `module.exports = withFacetpack(...)`
 * - `exports = withFacetpack(...)`
 *
 * If the Facetpack wrapper is not applied, the check is skipped.
 *
 * @why
 * Facetpack requires the Metro resolver to be wrapped with
 * `withFacetpack` in order to properly apply custom resolution
 * logic and transformations.
 *
 * @category Metro
 */
export const checkResolverConfigured: Check = {
  name: 'resolver-configured',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) return null

    const content = readFileSync(configPath, 'utf-8')

    const isApplied =
      /module\.exports\s*=\s*withFacetpack\s*\(/.test(content) ||
      /exports\s*=\s*withFacetpack\s*\(/.test(content)

    if (!isApplied) return null

    return {
      label: 'Resolver: facetpack',
      status: 'success',
    }
  },
}
