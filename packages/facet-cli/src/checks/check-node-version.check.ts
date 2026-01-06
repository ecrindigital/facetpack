import type { Check } from './types'

const MIN_NODE_VERSION = 18

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
