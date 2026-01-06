import type { Rule } from './types'

const MIN_NODE_VERSION = 18

export const nodeVersion: Rule = {
  name: 'node-version',
  description: 'Check Node.js version',

  async run() {
    const current = process.versions.node
    const major = parseInt(current.split('.')[0] ?? '0', 10)

    if (major < MIN_NODE_VERSION) {
      return {
        message: `Node.js ${current} is outdated. Minimum required: ${MIN_NODE_VERSION}`,
        severity: 'error',
      }
    }

    return null
  },
}
