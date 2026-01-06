import type { Check } from './types'

const SUPPORTED_VERSIONS = ['0.79', '0.80', '0.81']

/**
 * Checks the installed React Native version and validates compatibility.
 *
 * @remarks
 * This check reads the `react-native` version from `package.json`
 * (both dependencies and devDependencies) and compares it against
 * a list of officially supported versions.
 *
 * Only the major and minor version numbers are considered
 * (e.g. `0.81.x` → `0.81`).
 *
 * @why
 * Facetpack is tested against specific React Native versions.
 * Using unsupported versions may lead to unexpected behavior
 * or broken builds.
 *
 * @category Packages
 */
export const checkReactNativeVersion: Check = {
  name: 'react-native-version',
  category: 'Packages',

  async run(ctx) {
    if (!ctx.packageJson) return null

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    const version = deps['react-native']
    if (!version) return null

    const cleanVersion = version.replace(/[\^~]/g, '')
    const majorMinor = cleanVersion.split('.').slice(0, 2).join('.')

    if (SUPPORTED_VERSIONS.includes(majorMinor)) {
      return {
        label: `react-native@${cleanVersion}`,
        status: 'success',
        detail: 'Compatible',
      }
    }

    return {
      label: `react-native@${cleanVersion}`,
      status: 'warning',
      detail: `May not be compatible (expected: ${SUPPORTED_VERSIONS.join(', ')})`,
    }
  },
}
