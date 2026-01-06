import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

/**
 * Known patterns that may conflict with Metro's serializer.
 *
 * @remarks
 * These patterns represent tools or configurations that override
 * Metro's default serializer behavior, which can interfere with
 * Facetpack features such as tree-shaking and optimized transforms.
 */
const SERIALIZER_CONFLICTS = [
  { pattern: /sentry|Sentry/, name: 'Sentry' },
  { pattern: /react-native-code-push/, name: 'CodePush' },
  { pattern: /customSerializer/, name: 'Custom serializer' },
  { pattern: /serializer\s*:\s*\{/, name: 'Serializer override' },
]

/**
 * Checks for potential Metro serializer conflicts.
 *
 * @remarks
 * This check scans the `metro.config.js` file for known patterns
 * that indicate a custom or overridden serializer configuration.
 *
 * Certain tools (such as Sentry or CodePush) may replace or modify
 * Metro’s serializer, which can disable tree-shaking or reduce
 * Facetpack’s effectiveness.
 *
 * If a conflict is detected, a warning is reported with the
 * identified source.
 *
 * @category Metro
 */
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
