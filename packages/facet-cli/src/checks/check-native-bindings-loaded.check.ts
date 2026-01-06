import type { Check } from './types'

/**
 * Checks if the native Facetpack bindings are loaded correctly.
 *
 * @remarks
 * Ensures that `@ecrindigital/facetpack-native` is installed and can be resolved at runtime.
 * This is required for Rust-powered native features in Facetpack.
 *
 * @why
 * Facetpack cannot function properly without loaded native bindings.
 *
 * @failure
 * - Returns `warning` if the native bindings cannot be loaded.
 *
 * @fix
 * - Ensure `@ecrindigital/facetpack-native` is installed.
 * - Rebuild native bindings if necessary.
 *
 * @category Installation
 */
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
