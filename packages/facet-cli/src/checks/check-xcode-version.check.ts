import { execSync } from 'node:child_process'
import type { Check } from './types'

/**
 * Checks whether Xcode is installed and verifies its version on macOS.
 *
 * @remarks
 * This check only runs on `darwin` (macOS) systems.
 * It executes `xcodebuild -version` to detect the installed Xcode version
 * and evaluates whether it meets the recommended minimum.
 *
 * React Native iOS builds depend on Xcode, and newer React Native versions
 * work best with recent Xcode releases. Xcode 15 or higher is recommended.
 *
 * If Xcode is missing, not configured, or an older version is detected,
 * a warning is reported with guidance for upgrading.
 *
 * @category Environment
 */
export const checkXcodeVersion: Check = {
  name: 'xcode-version',
  category: 'Environment',

  async run() {
    if (process.platform !== 'darwin') return null

    try {
      const output = execSync('xcodebuild -version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      const match = output.match(/Xcode (\d+\.\d+)/)
      const version = match?.[1] ?? 'unknown'

      const major = parseInt(version.split('.')[0] ?? '0', 10)

      if (major >= 15) {
        return {
          label: `Xcode ${version}`,
          status: 'success',
        }
      }

      return {
        label: `Xcode ${version}`,
        status: 'warning',
        detail: 'Xcode 15+ recommended',
      }
    } catch {
      return {
        label: 'Xcode',
        status: 'warning',
        detail: 'Not installed or not configured',
      }
    }
  },
}
