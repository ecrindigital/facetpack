import { execSync } from 'node:child_process'
import type { Check } from './types'

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
