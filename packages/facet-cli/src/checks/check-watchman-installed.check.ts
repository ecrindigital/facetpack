import { execSync } from 'node:child_process'
import type { Check } from './types'

export const checkWatchmanInstalled: Check = {
  name: 'watchman-installed',
  category: 'Environment',

  async run() {
    try {
      execSync('which watchman', { encoding: 'utf-8' })
      return {
        label: 'Watchman installed',
        status: 'success',
      }
    } catch {
      return {
        label: 'Watchman',
        status: 'warning',
        detail: 'Not installed (recommended)',
      }
    }
  },
}
