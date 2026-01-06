import { execSync } from 'node:child_process'
import type { Check } from './types'

function getVersion(cmd: string): string | null {
  try {
    return execSync(`${cmd} --version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

export const checkPackageManagerVersion: Check = {
  name: 'package-manager-version',
  category: 'Environment',

  async run() {
    const npm = getVersion('npm')
    const yarn = getVersion('yarn')
    const pnpm = getVersion('pnpm')
    const bun = getVersion('bun')

    const managers: string[] = []

    if (bun) managers.push(`bun ${bun}`)
    if (pnpm) managers.push(`pnpm ${pnpm}`)
    if (yarn) managers.push(`yarn ${yarn}`)
    if (npm) managers.push(`npm ${npm}`)

    if (managers.length === 0) {
      return {
        label: 'Package manager',
        status: 'error',
        detail: 'No package manager found',
      }
    }

    return {
      label: managers[0] ?? 'Unknown',
      status: 'success',
      detail: managers.length > 1 ? `+${managers.length - 1} more` : undefined,
    }
  },
}
