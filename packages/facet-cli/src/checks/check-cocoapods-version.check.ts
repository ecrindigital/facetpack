import { execSync } from 'node:child_process'
import type { Check } from './types'

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
