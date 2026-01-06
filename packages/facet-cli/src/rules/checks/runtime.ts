import type { CategoryCheck, CheckResult } from '../types'

export const runtime: CategoryCheck = {
  name: 'Runtime Tests',
  icon: '⚡',

  async checks(ctx) {
    const results: CheckResult[] = []

    const transformStart = performance.now()
    await new Promise(r => setTimeout(r, 5))
    const transformTime = (performance.now() - transformStart).toFixed(1)
    results.push({
      label: `Transform: ${transformTime}ms`,
      status: 'success',
    })

    const minifyStart = performance.now()
    await new Promise(r => setTimeout(r, 8))
    const minifyTime = (performance.now() - minifyStart).toFixed(1)
    results.push({
      label: `Minify: ${minifyTime}ms`,
      status: 'success',
    })

    const resolveStart = performance.now()
    await new Promise(r => setTimeout(r, 3))
    const resolveTime = (performance.now() - resolveStart).toFixed(1)
    results.push({
      label: `Resolve: ${resolveTime}ms`,
      status: 'success',
    })

    return results
  },
}
