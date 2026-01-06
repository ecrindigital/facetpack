import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/

export const checkStoreCompatibility: Check = {
  name: 'store-compatibility',
  category: 'Installation',

  async run(ctx) {
    const appJsonPath = join(ctx.cwd, 'app.json')

    if (!existsSync(appJsonPath)) {
      return null
    }

    try {
      const content = readFileSync(appJsonPath, 'utf-8')
      const config = JSON.parse(content)
      const expo = config.expo

      if (!expo) return null

      const issues: string[] = []

      if (expo.version && !SEMVER_REGEX.test(expo.version)) {
        issues.push('version must be semver (X.Y.Z)')
      }

      if (expo.ios) {
        if (expo.ios.buildNumber && !/^\d+$/.test(expo.ios.buildNumber)) {
          issues.push('iOS buildNumber must be numeric')
        }

        if (!expo.ios.bundleIdentifier) {
          issues.push('missing iOS bundleIdentifier')
        }

        if (!expo.ios.supportsTablet && expo.ios.supportsTablet !== false) {
          issues.push('iOS supportsTablet not defined')
        }
      } else {
        issues.push('no iOS config')
      }

      if (expo.android) {
        if (expo.android.versionCode && typeof expo.android.versionCode !== 'number') {
          issues.push('Android versionCode must be number')
        }

        if (!expo.android.package) {
          issues.push('missing Android package')
        }

        if (!expo.android.adaptiveIcon && !expo.icon) {
          issues.push('no Android icon defined')
        }
      } else {
        issues.push('no Android config')
      }

      if (!expo.icon) {
        issues.push('no app icon')
      }

      if (!expo.splash) {
        issues.push('no splash screen config')
      }

      if (issues.length > 0) {
        const storeReady = issues.filter(i =>
          i.includes('bundleIdentifier') ||
          i.includes('package') ||
          i.includes('icon')
        ).length === 0

        return {
          label: 'Store compatibility',
          status: storeReady ? 'warning' : 'error',
          detail: issues[0] + (issues.length > 1 ? ` (+${issues.length - 1} more)` : ''),
        }
      }

      return {
        label: 'Store compatibility',
        status: 'success',
        detail: 'Ready for App Store & Play Store',
      }
    } catch {
      return null
    }
  },
}
