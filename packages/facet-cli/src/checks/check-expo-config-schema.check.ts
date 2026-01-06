import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

export const checkExpoConfigSchema: Check = {
  name: 'expo-config-schema',
  category: 'Installation',

  async run(ctx) {
    const appJsonPath = join(ctx.cwd, 'app.json')
    const appConfigJsPath = join(ctx.cwd, 'app.config.js')
    const appConfigTsPath = join(ctx.cwd, 'app.config.ts')

    const hasAppJson = existsSync(appJsonPath)
    const hasAppConfigJs = existsSync(appConfigJsPath)
    const hasAppConfigTs = existsSync(appConfigTsPath)

    if (!hasAppJson && !hasAppConfigJs && !hasAppConfigTs) {
      return null
    }

    if (hasAppJson) {
      try {
        const content = readFileSync(appJsonPath, 'utf-8')
        const config = JSON.parse(content)

        if (!config.expo) {
          return {
            label: 'app.json schema',
            status: 'warning',
            detail: 'Missing "expo" root key',
          }
        }

        const expo = config.expo
        const issues: string[] = []

        if (!expo.name) issues.push('name')
        if (!expo.slug) issues.push('slug')

        if (issues.length > 0) {
          return {
            label: 'app.json schema',
            status: 'warning',
            detail: `Missing required fields: ${issues.join(', ')}`,
          }
        }

        return {
          label: 'app.json valid',
          status: 'success',
        }
      } catch {
        return {
          label: 'app.json',
          status: 'error',
          detail: 'Invalid JSON syntax',
        }
      }
    }

    if (hasAppConfigJs || hasAppConfigTs) {
      const configFile = hasAppConfigTs ? 'app.config.ts' : 'app.config.js'
      return {
        label: `${configFile} found`,
        status: 'success',
        detail: 'Dynamic config',
      }
    }

    return null
  },
}
