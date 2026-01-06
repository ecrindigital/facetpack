import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { Check } from './types'

/**
 * Checks whether the Android SDK is installed and properly configured.
 *
 * @remarks
 * This check verifies that either `ANDROID_HOME` or `ANDROID_SDK_ROOT`
 * environment variable is set and points to a valid directory.
 * It also attempts to detect the installed Android Debug Bridge (adb)
 * version to confirm the SDK is usable.
 *
 * @why
 * A correctly configured Android SDK is required to build and run
 * React Native applications on Android.
 *
 * @failure
 * - Returns a warning if the Android SDK environment variables are not set.
 * - Returns a warning if the configured SDK directory does not exist.
 *
 * @fix
 * - Install Android Studio.
 * - Ensure the Android SDK is installed.
 * - Set `ANDROID_HOME` or `ANDROID_SDK_ROOT` to the SDK path.
 *
 * @category Environment
 */
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
