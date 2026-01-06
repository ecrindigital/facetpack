import type { Rule } from './types'

const SUPPORTED_EXPO_VERSIONS = ['53', '54']

export const expoSdk: Rule = {
  name: 'expo-sdk',
  description: 'Check Expo SDK version',

  async run(ctx) {
    if (!ctx.packageJson) {
      return null
    }

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    const expoVersion = deps['expo']
    if (!expoVersion) {
      return null
    }

    const version = expoVersion.replace(/[\^~]/g, '')
    const major = version.split('.')[0] ?? '0'

    if (!SUPPORTED_EXPO_VERSIONS.includes(major)) {
      return {
        message: `Expo SDK ${major} may not be fully supported. Recommended: ${SUPPORTED_EXPO_VERSIONS.join(', ')}`,
        severity: 'warning',
      }
    }

    return null
  },
}
