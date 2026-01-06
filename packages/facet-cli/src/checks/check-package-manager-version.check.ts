import { execSync } from 'node:child_process'
import type { Check } from './types'

/**
 * Executes a package manager version command and returns its version.
 *
 * @param cmd - The package manager command (npm, yarn, pnpm, bun)
 * @returns The version string if available, otherwise null
 */
function getVersion(cmd: string): string | null {
  try {
    return execSync(`${cmd} --version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

/**
 * Checks whether at least one supported JavaScript package manager
 * (npm, yarn, pnpm, or bun) is installed and accessible.
 *
 * @remarks
 * Facetpack requires a package manager to install dependencies and run scripts.
 *
 * @why
 * Without a package manager, project dependencies cannot be managed.
 *
 * @failure
 * - Returns `error` if no package manager is detected.
 *
 * @fix
 * - Install at least one package manager (npm, yarn, pnpm, or bun).
 *
 * @category Environment
 */
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
