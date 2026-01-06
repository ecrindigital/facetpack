import { defineCommand } from 'citty'
import consola from 'consola'
import pc from 'picocolors'

export const build = defineCommand({
  meta: {
    name: 'build',
    description: 'Build the application for production',
  },
  args: {
    platform: {
      type: 'string',
      description: 'Platform to build (ios, android)',
      alias: 'p',
      required: true,
    },
    release: {
      type: 'boolean',
      description: 'Build in release mode',
      default: true,
    },
    minify: {
      type: 'boolean',
      description: 'Minify the bundle',
      default: true,
    },
  },
  run({ args }) {
    consola.box(`${pc.cyan('Facet Build')}`)
    consola.info(`Building for ${pc.cyan(args.platform)}...`)

    if (args.release) {
      consola.info(`Mode: ${pc.green('release')}`)
    }

    if (args.minify) {
      consola.info(`Minification: ${pc.green('enabled')}`)
    }

    consola.warn('Build not yet implemented')
  },
})
