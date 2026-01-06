import type { Check } from './types'

export const checkFacetpackNativeInstalled: Check = {
  name: 'facetpack-native-installed',
  category: 'Installation',

  async run(ctx) {
    if (!ctx.packageJson) return null

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    const version = deps['@ecrindigital/facetpack-native']

    if (version) {
      return {
        label: `@ecrindigital/facetpack-native@${version.replace(/[\^~]/g, '')}`,
        status: 'success',
      }
    }

    return {
      label: '@ecrindigital/facetpack-native',
      status: 'warning',
      detail: 'Not installed (required for native builds)',
    }
  },
}
