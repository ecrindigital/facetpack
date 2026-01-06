import { execSync } from 'node:child_process'
import type { Check } from './types'

/**
 * Checks the installed version of CocoaPods on macOS.
 *
 * @remarks
 * Runs `pod --version` to verify CocoaPods installation.
 * Only runs on macOS (`process.platform === 'darwin'`).
 *
 * @why
 * CocoaPods is required for managing iOS native dependencies in React Native projects.
 *
 * @failure
 * - Returns a warning if CocoaPods is not installed.
 *
 * @fix
 * - Install CocoaPods using `gem install cocoapods`.
 *
 * @category Environment
 */
export const checkCocoapodsVersion: Check = {
  name: 'cocoapods-version',
  category: 'Environment',

  async run() {
    if (process.platform !== 'darwin') return null

    try {
      const version = execSync('pod --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()

      return {
        label: `CocoaPods ${version}`,
        status: 'success',
      }
    } catch {
      return {
        label: 'CocoaPods',
        status: 'warning',
        detail: 'Not installed (required for iOS)',
      }
    }
  },
}
