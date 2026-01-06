import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

/**
 * Checks whether `metro.config.js` exists in the project root.
 *
 * @remarks
 * Metro configuration is required for Facetpack to integrate with the React Native bundler.
 *
 * @why
 * Without a Metro config, Facetpack cannot apply its Rust-based transforms.
 *
 * @failure
 * - Returns `error` if `metro.config.js` is not found.
 *
 * @fix
 * - Create a `metro.config.js` file in the project root.
 *
 * @category Metro
 */
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
