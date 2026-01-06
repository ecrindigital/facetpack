import type { Check } from './types'

/**
 * Checks the current operating system and CPU architecture.
 *
 * @remarks
 * This information is useful for debugging platform-specific issues,
 * especially when working with native bindings or binaries.
 *
 * @why
 * Some Facetpack features or native modules may behave differently
 * depending on the operating system and architecture.
 *
 * @category Environment
 */
export const checkPlatform: Check = {
  name: 'platform',
  category: 'Environment',

  async run() {
    const platform = `${process.platform}-${process.arch}`

    return {
      label: `Platform ${platform}`,
      status: 'success',
    }
  },
}
