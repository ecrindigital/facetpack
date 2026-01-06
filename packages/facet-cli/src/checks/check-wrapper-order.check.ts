import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

const OTHER_WRAPPERS = [
  'withSentry',
  'withExpo',
  'withNativeWind',
  'withTamagui',
  'withReanimated',
]

/**
 * Ensures that `withFacetpack` is applied as the innermost Metro config wrapper.
 *
 * @remarks
 * This check analyzes the `module.exports` section of `metro.config.js`
 * and compares the order of `withFacetpack` against other common wrappers
 * such as Expo, Sentry, Reanimated, etc.
 *
 * Facetpack must be the innermost wrapper to guarantee that its transformer
 * and resolver are not overridden by other integrations.
 *
 * If another wrapper is applied inside `withFacetpack`, a warning is reported
 * with guidance on the correct order.
 *
 * @category Metro
 */
export const checkWrapperOrder: Check = {
  name: 'wrapper-order',
  category: 'Metro',

  async run(ctx) {
    const configPath = join(ctx.cwd, 'metro.config.js')

    if (!existsSync(configPath)) return null

    const content = readFileSync(configPath, 'utf-8')

    if (!content.includes('withFacetpack')) return null

    const facetpackIndex = content.indexOf('withFacetpack')

    for (const wrapper of OTHER_WRAPPERS) {
      if (content.includes(wrapper)) {
        const wrapperIndex = content.indexOf(wrapper)

        const facetpackInExport = content.slice(content.lastIndexOf('module.exports')).includes('withFacetpack')
        const wrapperInExport = content.slice(content.lastIndexOf('module.exports')).includes(wrapper)

        if (facetpackInExport && wrapperInExport) {
          const exportSection = content.slice(content.lastIndexOf('module.exports'))
          const facetpackPos = exportSection.indexOf('withFacetpack')
          const wrapperPos = exportSection.indexOf(wrapper)

          if (facetpackPos < wrapperPos) {
            return {
              label: 'Wrapper order',
              status: 'warning',
              detail: `withFacetpack should be innermost — ${wrapper} should wrap it`,
            }
          }
        }
      }
    }

    return {
      label: 'Wrapper order',
      status: 'success',
      detail: 'withFacetpack is innermost',
    }
  },
}
