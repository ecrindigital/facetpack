import type { Check } from './types'

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
