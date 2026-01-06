import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { Check } from './types'

export const checkAndroidSdk: Check = {
  name: 'android-sdk',
  category: 'Environment',

  async run() {
    const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT

    if (!androidHome) {
      return {
        label: 'Android SDK',
        status: 'warning',
        detail: 'ANDROID_HOME not set',
      }
    }

    if (!existsSync(androidHome)) {
      return {
        label: 'Android SDK',
        status: 'warning',
        detail: 'Directory not found',
      }
    }

    try {
      const output = execSync('adb --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const match = output.match(/Android Debug Bridge version (\d+\.\d+\.\d+)/)
      const version = match?.[1] ?? 'installed'

      return {
        label: `Android SDK`,
        status: 'success',
        detail: `adb ${version}`,
      }
    } catch {
      return {
        label: 'Android SDK',
        status: 'success',
        detail: androidHome.split('/').pop(),
      }
    }
  },
}
