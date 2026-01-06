import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CategoryCheck, CheckResult } from '../types'

export const metro: CategoryCheck = {
  name: 'Metro Config',
  icon: '🚇',

  async checks(ctx) {
    const results: CheckResult[] = []

    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) {
      results.push({
        label: 'metro.config.js',
        status: 'error',
        detail: 'Not found',
      })
      return results
    }

    results.push({
      label: 'metro.config.js found',
      status: 'success',
    })

    const content = readFileSync(configPath, 'utf-8')

    // withFacetpack
    if (content.includes('withFacetpack')) {
      results.push({
        label: 'withFacetpack() applied',
        status: 'success',
      })
    } else {
      results.push({
        label: 'withFacetpack()',
        status: 'error',
        detail: 'Not applied in metro.config.js',
      })
    }

    // Check transformer
    if (content.includes('transformer') && content.includes('facetpack')) {
      results.push({
        label: 'Transformer: facetpack',
        status: 'success',
      })
    }

    // Check resolver
    if (content.includes('resolver') || content.includes('withFacetpack')) {
      results.push({
        label: 'Resolver: facetpack',
        status: 'success',
      })
    }

    // Check for known conflicts
    if (content.includes('sentry') || content.includes('Sentry')) {
      results.push({
        label: 'Tree-shaking: disabled',
        status: 'warning',
        detail: 'Sentry detected',
      })
    }

    return results
  },
}
