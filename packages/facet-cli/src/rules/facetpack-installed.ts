import type { Rule } from './types'

export const facetpackInstalled: Rule = {
  name: 'facetpack-installed',
  description: 'Check if Facetpack is installed',

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

    const hasMain = '@ecrindigital/facetpack' in deps
    const hasNative = '@ecrindigital/facetpack-native' in deps

    if (!hasMain) {
      return {
        message: '@ecrindigital/facetpack is not installed',
        severity: 'error',
      }
    }

    if (!hasNative) {
      return {
        message: '@ecrindigital/facetpack-native is not installed (required for native builds)',
        severity: 'warning',
      }
    }

    return null
  },
}
