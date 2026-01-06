import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

export const checkPackageJson: Check = {
  name: 'package-json',
  category: 'Installation',

  async run(ctx) {
    const packageJsonPath = join(ctx.cwd, 'package.json')

    if (!existsSync(packageJsonPath)) {
      return {
        label: 'package.json',
        status: 'error',
        detail: 'Not found',
      }
    }

    try {
      const content = readFileSync(packageJsonPath, 'utf-8')
      const pkg = JSON.parse(content)
      const issues: string[] = []

      if (!pkg.name) {
        issues.push('missing name')
      }

      if (!pkg.version) {
        issues.push('missing version')
      }

      if (!pkg.dependencies && !pkg.devDependencies) {
        issues.push('no dependencies')
      }

      const hasReactNative = pkg.dependencies?.['react-native'] || pkg.devDependencies?.['react-native']
      const hasExpo = pkg.dependencies?.['expo'] || pkg.devDependencies?.['expo']

      if (!hasReactNative && !hasExpo) {
        issues.push('no react-native or expo')
      }

      if (pkg.main && !existsSync(join(ctx.cwd, pkg.main))) {
        issues.push(`main entry not found: ${pkg.main}`)
      }

      if (issues.length > 0) {
        return {
          label: 'package.json',
          status: 'warning',
          detail: issues[0] + (issues.length > 1 ? ` (+${issues.length - 1} more)` : ''),
        }
      }

      const scripts = Object.keys(pkg.scripts || {}).slice(0, 3).join(', ')
      return {
        label: 'package.json valid',
        status: 'success',
        detail: scripts ? `scripts: ${scripts}` : undefined,
      }
    } catch {
      return {
        label: 'package.json',
        status: 'error',
        detail: 'Invalid JSON syntax',
      }
    }
  },
}
