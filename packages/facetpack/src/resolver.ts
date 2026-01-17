import { resolveSync, type ResolverOptions } from '@ecrindigital/facetpack-native'
import { globalStats } from './stats'

export { resolveSync, type ResolverOptions }

export function createResolver(options?: ResolverOptions) {
  return {
    resolve(originModulePath: string, moduleName: string): string | null {
      const directory = originModulePath.substring(0, originModulePath.lastIndexOf('/'))
      const result = resolveSync(directory, moduleName, options)

      if (result.path) {
        globalStats.recordResolve('facetpack')
      } else {
        globalStats.recordResolve('metro')
      }

      return result.path ?? null
    }
  }
}
