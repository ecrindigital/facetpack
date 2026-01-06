import { execSync } from 'node:child_process'
import type { Check } from './types'

/**
 * Checks whether Bun is installed on the system.
 *
 * @remarks
 * This check attempts to run `bun --version` to verify installation.
 * Bun is used by Facetpack for faster builds and tooling.
 *
 * @why
 * Bun can improve development and build performance for React Native projects,
 * but it is optional.
 *
 * @failure
 * - Returns a warning if Bun is not installed.
 *
 * @fix
 * - Install Bun from https://bun.sh
 *
 * @category Environment
 */
export const checkBunInstalled: Check = {
  name: 'bun-installed',
  category: 'Environment',

  async run() {
    try {
      const bunVersion = execSync('bun --version', { encoding: 'utf-8' }).trim()
      return {
        label: `bun ${bunVersion}`,
        status: 'success',
      }
    } catch {
      return {
        label: 'bun',
        status: 'warning',
        detail: 'Not installed (optional)',
      }
    }
  },
}
