import { execSync } from 'node:child_process'
import type { CategoryCheck, CheckResult } from '../types'

export const environment: CategoryCheck = {
  name: 'Environment',
  icon: '🖥',

  async checks() {
    const results: CheckResult[] = []

    const nodeVersion = process.versions.node
    const nodeMajor = parseInt(nodeVersion.split('.')[0] ?? '0', 10)
    results.push({
      label: `Node.js ${nodeVersion}`,
      status: nodeMajor >= 18 ? 'success' : 'error',
      detail: nodeMajor >= 18 ? '>= 18 required' : 'Upgrade to Node.js 18+',
    } as CheckResult)

    try {
      const bunVersion = execSync('bun --version', { encoding: 'utf-8' }).trim()
      results.push({
        label: `bun ${bunVersion}`,
        status: 'success',
      } as CheckResult)
    } catch {
      results.push({
        label: 'bun',
        status: 'warning',
        detail: 'Not installed (optional)',
      } as CheckResult)
    }

    const platform = `${process.platform}-${process.arch}`
    results.push({
      label: `Platform ${platform}`,
      status: 'success',
    } as CheckResult)

    try {
      execSync('which watchman', { encoding: 'utf-8' })
      results.push({
        label: 'Watchman installed',
        status: 'success',
      } as CheckResult)
    } catch {
      results.push({
        label: 'Watchman',
        status: 'warning',
        detail: 'Not installed (recommended)',
      } as CheckResult)
    }

    return results
  },
}
