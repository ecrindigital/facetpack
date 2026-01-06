import type { Check } from './types'

export const checkNativeBindingsLoaded: Check = {
  name: 'native-bindings-loaded',
  category: 'Installation',

  async run(ctx) {
    if (!ctx.packageJson) return null

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    if (!deps['@ecrindigital/facetpack-native']) return null

    const platform = `${process.platform}-${process.arch}`

    try {
      require.resolve('@ecrindigital/facetpack-native')
      return {
        label: 'Native bindings loaded',
        status: 'success',
        detail: platform,
      }
    } catch {
      return {
        label: 'Native bindings',
        status: 'warning',
        detail: `Not loaded for ${platform}`,
      }
    }
  },
}
