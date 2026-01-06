import type { Check } from './types'

const SUPPORTED_VERSIONS = ['52', '53', '54']

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
