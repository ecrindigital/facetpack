import type { Check } from './types'

const SUPPORTED_VERSIONS = ['0.79', '0.80', '0.81']

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
