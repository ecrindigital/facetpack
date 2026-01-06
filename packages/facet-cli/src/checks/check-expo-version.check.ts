import type { Check } from './types'

const SUPPORTED_VERSIONS = ['52', '53', '54']

/**
 * Checks if the installed Expo version in the project is supported.
 *
 * @remarks
 * Looks at `dependencies` and `devDependencies` in `package.json` to find the Expo version.
 * Compares the major version against a list of supported versions.
 *
 * @why
 * Ensures compatibility with Facetpack, as certain Expo versions may have breaking changes.
 *
 * @failure
 * - Returns a warning if the installed Expo version is not supported.
 *
 * @fix
 * - Upgrade or downgrade Expo to a supported version (`52`, `53`, or `54`).
 *
 * @category Packages
 */
export const checkExpoVersion: Check = {
  name: 'expo-version',
  category: 'Packages',

  async run(ctx) {
    if (!ctx.packageJson) return null

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    const version = deps['expo']
    if (!version) return null

    const cleanVersion = version.replace(/[\^~]/g, '')
    const major = cleanVersion.split('.')[0] ?? '0'

    if (SUPPORTED_VERSIONS.includes(major)) {
      return {
        label: `expo@${cleanVersion}`,
        status: 'success',
        detail: 'Compatible',
      }
    }

    return {
      label: `expo@${cleanVersion}`,
      status: 'warning',
      detail: `May not be compatible (expected: ${SUPPORTED_VERSIONS.join(', ')})`,
    }
  },
}
