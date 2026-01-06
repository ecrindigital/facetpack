import type { Check } from './types'

/**
 * Checks if `@ecrindigital/facetpack-native` is installed in the project.
 *
 * @remarks
 * Looks at `dependencies` and `devDependencies` in `package.json` to verify native bindings.
 *
 * @why
 * Native bindings are required for Rust-powered performance features in Facetpack.
 *
 * @failure
 * - Returns `warning` if `@ecrindigital/facetpack-native` is not listed as a dependency.
 *
 * @fix
 * - Install the package via your package manager, e.g., `npm install @ecrindigital/facetpack-native`.
 *
 * @category Installation
 */
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
