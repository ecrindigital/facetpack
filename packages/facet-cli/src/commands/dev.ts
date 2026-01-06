import { defineCommand } from 'citty'
import consola from 'consola'
import pc from 'picocolors'

export const dev = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start the development server',
  },
  args: {
    platform: {
      type: 'string',
      description: 'Platform to run (ios, android, web)',
      alias: 'p',
    },
    port: {
      type: 'string',
      description: 'Port for the dev server',
      default: '8081',
    },
    clear: {
      type: 'boolean',
      description: 'Clear Metro cache',
      default: false,
    },
  },
  run({ args }) {
    consola.box(`${pc.cyan('Facet')} ${pc.dim('v0.1.0')}`)
    consola.info(`Starting dev server on port ${pc.green(args.port)}...`)

    if (args.platform) {
      consola.info(`Platform: ${pc.cyan(args.platform)}`)
    }

    if (args.clear) {
      consola.info('Clearing Metro cache...')
    }

    consola.warn('Dev server not yet implemented')
  },
})
