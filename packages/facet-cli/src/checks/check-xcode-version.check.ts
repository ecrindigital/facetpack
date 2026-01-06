import { execSync } from 'node:child_process'
import type { Check } from './types'

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
