import type { Rule } from './types'

const SUPPORTED_RN_VERSIONS = ['0.79', '0.80', '0.81']

export const reactNativeVersion: Rule = {
  name: 'react-native-version',
  description: 'Check React Native version compatibility',

  async run(ctx) {
    if (!ctx.packageJson) {
      return {
        message: 'No package.json found',
        severity: 'error',
      }
    }

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    const rnVersion = deps['react-native']
    if (!rnVersion) {
      return {
        message: 'react-native is not installed',
        severity: 'error',
      }
    }

    const version = rnVersion.replace(/[\^~]/g, '')
    const majorMinor = version.split('.').slice(0, 2).join('.')

    if (!SUPPORTED_RN_VERSIONS.includes(majorMinor)) {
      return {
        message: `React Native ${version} may not be fully supported. Recommended: ${SUPPORTED_RN_VERSIONS.join(', ')}`,
        severity: 'warning',
      }
    }

    return null
  },
}
