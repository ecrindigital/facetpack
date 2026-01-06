import type { Check } from './types'

/**
 * Checks if `@ecrindigital/facetpack` is installed in the project.
 *
 * @remarks
 * Looks at `dependencies` and `devDependencies` in `package.json` to determine if Facetpack is installed.
 *
 * @why
 * Facetpack must be installed for Metro integration and Rust-powered transformations.
 *
 * @failure
 * - Returns an error if `package.json` is missing.
 * - Returns an error if `@ecrindigital/facetpack` is not listed as a dependency.
 *
 * @fix
 * - Install Facetpack via your package manager, e.g., `npm install @ecrindigital/facetpack`.
 *
 * @category Installation
 */
export const checkFacetpackInstalled: Check = {
  name: 'facetpack-installed',
  category: 'Installation',

  async run(ctx) {
    if (!ctx.packageJson) {
      return {
        label: 'package.json',
        status: 'error',
        detail: 'Not found',
      }
    }

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    const version = deps['@ecrindigital/facetpack']

    if (version) {
      return {
        label: `@ecrindigital/facetpack@${version.replace(/[\^~]/g, '')}`,
        status: 'success',
      }
    }

    return {
      label: '@ecrindigital/facetpack',
      status: 'error',
      detail: 'Not installed',
    }
  },
}
