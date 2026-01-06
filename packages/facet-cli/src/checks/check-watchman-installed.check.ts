import { execSync } from 'node:child_process'
import type { Check } from './types'

/**
 * Checks whether Watchman is installed on the system.
 *
 * @remarks
 * Watchman is a file-watching service commonly used by Metro
 * to efficiently detect file changes. While not strictly required,
 * it significantly improves performance and reliability,
 * especially for large React Native projects.
 *
 * If Watchman is not installed, this check reports a warning
 * instead of an error, since projects can still function without it.
 *
 * @category Environment
 */
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
