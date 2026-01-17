import type { Check } from './types'

const MIN_NODE_VERSION = 18

/**
 * Checks if the installed Node.js version meets the minimum requirement.
 *
 * @remarks
 * Facetpack and Metro require Node.js 18 or higher to work properly.
 *
 * @why
 * Using an unsupported Node version can cause build or runtime errors.
 *
 * @failure
 * - Returns `error` if Node.js version is below 18.
 *
 * @fix
 * - Upgrade Node.js to version 18 or higher.
 *
 * @category Environment
 */
export const checkNodeVersion: Check = {
  name: 'node-version',
  category: 'Environment',

  async run() {
    const nodeVersion = process.versions.node
    const nodeMajor = parseInt(nodeVersion.split('.')[0] ?? '0', 10)

    return {
      label: `Node.js ${nodeVersion}`,
      status: nodeMajor >= MIN_NODE_VERSION ? 'success' : 'error',
      detail: nodeMajor >= MIN_NODE_VERSION ? '>= 18 required' : 'Upgrade to Node.js 18+',
    }
  },
}
