import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

const BUNDLE_ID_REGEX = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/

export const checkExpoConfigCommonIssues: Check = {
  name: 'expo-config-common-issues',
  category: 'Installation',

  async run(ctx) {
    const appJsonPath = join(ctx.cwd, 'app.json')

    if (!existsSync(appJsonPath)) return null

    try {
      const content = readFileSync(appJsonPath, 'utf-8')
      const config = JSON.parse(content)
      const expo = config.expo

      if (!expo) return null

      const issues: string[] = []

      if (expo.ios?.bundleIdentifier) {
        if (!BUNDLE_ID_REGEX.test(expo.ios.bundleIdentifier)) {
          issues.push('Invalid iOS bundleIdentifier format')
        }
        if (expo.ios.bundleIdentifier.includes('com.example')) {
          issues.push('iOS bundleIdentifier contains placeholder "com.example"')
        }
      }

      if (expo.android?.package) {
        if (!BUNDLE_ID_REGEX.test(expo.android.package)) {
          issues.push('Invalid Android package format')
        }
        if (expo.android.package.includes('com.example')) {
          issues.push('Android package contains placeholder "com.example"')
        }
      }

      if (expo.icon && !existsSync(join(ctx.cwd, expo.icon))) {
        issues.push(`Icon not found: ${expo.icon}`)
      }

      if (expo.splash?.image && !existsSync(join(ctx.cwd, expo.splash.image))) {
        issues.push(`Splash image not found: ${expo.splash.image}`)
      }

      if (expo.version === '1.0.0' && expo.ios?.buildNumber === '1') {
        issues.push('Using default version/buildNumber')
      }

      if (issues.length > 0) {
        return {
          label: 'Expo config issues',
          status: 'warning',
          detail: issues[0] + (issues.length > 1 ? ` (+${issues.length - 1} more)` : ''),
        }
      }

      return {
        label: 'Expo config',
        status: 'success',
        detail: 'No common issues',
      }
    } catch {
      return null
    }
  },
}
