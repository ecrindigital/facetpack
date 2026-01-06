import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

const SERIALIZER_CONFLICTS = [
  { pattern: /sentry|Sentry/, name: 'Sentry' },
  { pattern: /react-native-code-push/, name: 'CodePush' },
  { pattern: /customSerializer/, name: 'Custom serializer' },
  { pattern: /serializer\s*:\s*\{/, name: 'Serializer override' },
]

export const checkSerializerConflict: Check = {
  name: 'serializer-conflict',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) return null

    const content = readFileSync(configPath, 'utf-8')

    for (const { pattern, name } of SERIALIZER_CONFLICTS) {
      if (pattern.test(content)) {
        return {
          label: 'Serializer conflict',
          status: 'warning',
          detail: `${name} detected — tree-shaking may be disabled`,
        }
      }
    }

    return null
  },
}
