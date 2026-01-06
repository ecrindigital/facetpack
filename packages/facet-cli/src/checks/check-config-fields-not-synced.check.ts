import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

export const checkConfigFieldsNotSynced: Check = {
  name: 'config-fields-not-synced',
  category: 'Installation',

  async run(ctx) {
    const appJsonPath = join(ctx.cwd, 'app.json')
    const iosDir = join(ctx.cwd, 'ios')
    const androidDir = join(ctx.cwd, 'android')

    if (!existsSync(appJsonPath)) return null

    const hasIos = existsSync(iosDir)
    const hasAndroid = existsSync(androidDir)

    if (!hasIos && !hasAndroid) return null

    try {
      const content = readFileSync(appJsonPath, 'utf-8')
      const config = JSON.parse(content)
      const expo = config.expo

      if (!expo) return null

      const issues: string[] = []

      if (hasIos) {
        const infoPlistPath = join(iosDir, expo.name || 'App', 'Info.plist')
        const pbxprojFiles = [
          join(iosDir, `${expo.name || 'App'}.xcodeproj`, 'project.pbxproj'),
          join(iosDir, 'Pods', 'Pods.xcodeproj', 'project.pbxproj'),
        ]

        if (existsSync(infoPlistPath)) {
          const plistContent = readFileSync(infoPlistPath, 'utf-8')

          if (expo.version && !plistContent.includes(expo.version)) {
            issues.push('iOS version may be out of sync')
          }
        }
      }

      if (hasAndroid) {
        const buildGradlePath = join(androidDir, 'app', 'build.gradle')

        if (existsSync(buildGradlePath)) {
          const gradleContent = readFileSync(buildGradlePath, 'utf-8')

          if (expo.android?.package) {
            if (!gradleContent.includes(expo.android.package)) {
              issues.push('Android package may be out of sync')
            }
          }

          if (expo.version) {
            const versionMatch = gradleContent.match(/versionName\s*["']([^"']+)["']/)
            if (versionMatch && versionMatch[1] !== expo.version) {
              issues.push('Android versionName may be out of sync')
            }
          }
        }
      }

      if (issues.length > 0) {
        return {
          label: 'Native config sync',
          status: 'warning',
          detail: `${issues[0]} — run npx expo prebuild`,
        }
      }

      return {
        label: 'Native config sync',
        status: 'success',
      }
    } catch {
      return null
    }
  },
}
