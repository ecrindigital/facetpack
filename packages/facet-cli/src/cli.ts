import { defineCommand } from 'citty'
import { dev } from './commands/dev'
import { build } from './commands/build'
import { doctor } from './commands/doctor'

export const main = defineCommand({
  meta: {
    name: 'facet',
    version: '0.1.0',
    description: 'Modern CLI for React Native development',
  },
  subCommands: {
    dev,
    build,
    doctor,
  },
})
