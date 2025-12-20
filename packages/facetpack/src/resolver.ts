import { resolveSync, type ResolverOptions } from 'facetpack-native'

export { resolveSync, type ResolverOptions }

export function createResolver(options?: ResolverOptions) {
  return {
    resolve(originModulePath: string, moduleName: string): string | null {
      const directory = originModulePath.substring(0, originModulePath.lastIndexOf('/'))
      const result = resolveSync(directory, moduleName, options)
      return result.path ?? null
    }
  }
}
