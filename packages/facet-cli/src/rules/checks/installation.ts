import type { CategoryCheck, CheckResult } from '../types'

export const installation: CategoryCheck = {
  name: 'Installation',
  icon: '📦',

  async checks(ctx) {
    const results: CheckResult[] = []

    if (!ctx.packageJson) {
      results.push({
        label: 'package.json',
        status: 'error',
        detail: 'Not found',
      })
      return results
    }

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    // Facetpack main
    const facetpackVersion = deps['@ecrindigital/facetpack']
    if (facetpackVersion) {
      results.push({
        label: `@ecrindigital/facetpack@${facetpackVersion.replace(/[\^~]/g, '')}`,
        status: 'success',
      })
    } else {
      results.push({
        label: '@ecrindigital/facetpack',
        status: 'error',
        detail: 'Not installed',
      })
    }

    // Facetpack native
    const nativeVersion = deps['@ecrindigital/facetpack-native']
    if (nativeVersion) {
      results.push({
        label: `@ecrindigital/facetpack-native@${nativeVersion.replace(/[\^~]/g, '')}`,
        status: 'success',
      })

      // Check native bindings
      const platform = `${process.platform}-${process.arch}`
      try {
        require.resolve('@ecrindigital/facetpack-native')
        results.push({
          label: `Native bindings loaded`,
          status: 'success',
          detail: platform,
        })
      } catch {
        results.push({
          label: 'Native bindings',
          status: 'warning',
          detail: `Not loaded for ${platform}`,
        })
      }
    } else {
      results.push({
        label: '@ecrindigital/facetpack-native',
        status: 'warning',
        detail: 'Not installed (required for native builds)',
      })
    }

    return results
  },
}
