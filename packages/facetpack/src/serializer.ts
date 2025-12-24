import {
  analyzeSync,
  shakeSync,
  type ModuleAnalysis,
} from '@ecrindigital/facetpack-native'

export interface SerializerModule {
  path: string
  output: Array<{ data: { code: string; map?: string } }>
  dependencies: Map<string, string>
}

export interface SerializerGraph {
  dependencies: Map<string, SerializerModule>
  entryPoints: Set<string>
}

export interface SerializerOptions {
  dev: boolean
  minify: boolean
  platform?: string
  projectRoot: string
  processModuleFilter?: (module: SerializerModule) => boolean
  createModuleId?: (path: string) => number
  getRunModuleStatement?: (moduleId: number) => string
  shouldAddToIgnoreList?: (module: SerializerModule) => boolean
}

export interface SerializerParams {
  entryPoint: string
  preModules: SerializerModule[]
  graph: SerializerGraph
  options: SerializerOptions
}

export type CustomSerializer = (
  entryPoint: string,
  preModules: SerializerModule[],
  graph: SerializerGraph,
  options: SerializerOptions
) => string | { code: string; map: string } | Promise<string | { code: string; map: string }>

export interface FacetpackSerializerConfig {
  treeShake?: boolean
}

/**
 * Creates a Facetpack serializer with tree-shaking support.
 * This serializer can be composed with existing Metro serializers.
 *
 * @example
 * ```js
 * // metro.config.js
 * const { createFacetpackSerializer } = require('@ecrindigital/facetpack')
 *
 * module.exports = {
 *   serializer: {
 *     customSerializer: createFacetpackSerializer(null, { treeShake: true }),
 *   },
 * }
 * ```
 */
export function createFacetpackSerializer(
  existingSerializer?: CustomSerializer | null,
  config: FacetpackSerializerConfig = {}
): CustomSerializer {
  return async (
    entryPoint: string,
    preModules: SerializerModule[],
    graph: SerializerGraph,
    options: SerializerOptions
  ) => {
    if (options.dev || config.treeShake === false) {
      if (existingSerializer) {
        return existingSerializer(entryPoint, preModules, graph, options)
      }
      return defaultSerialize(entryPoint, preModules, graph, options)
    }

    const analyses = new Map<string, ModuleAnalysis>()
    for (const [path, module] of graph.dependencies) {
      if (path.includes('node_modules')) {
        continue
      }

      try {
        const code = module.output[0]?.data?.code ?? ''
        const analysis = analyzeSync(path, code)
        analyses.set(path, analysis)
      } catch {
        analyses.set(path, {
          exports: [],
          imports: [],
          hasSideEffects: true,
        })
      }
    }

    const usedExports = computeUsedExports(entryPoint, analyses, graph)

    const shakenModules = new Map<string, { code: string; map?: string }>()
    let totalRemoved = 0

    for (const [path, module] of graph.dependencies) {
      if (path.includes('node_modules')) {
        const code = module.output[0]?.data?.code ?? ''
        shakenModules.set(path, { code })
        continue
      }

      const used = usedExports.get(path)
      const analysis = analyses.get(path)

      if ((!used || used.size === 0) && analysis && !analysis.hasSideEffects) {
        totalRemoved++
        continue
      }

      try {
        const code = module.output[0]?.data?.code ?? ''
        const usedArray = used ? Array.from(used) : ['*']
        const result = shakeSync(path, code, usedArray)
        shakenModules.set(path, { code: result.code, map: result.map ?? undefined })
        totalRemoved += result.removedExports.length
      } catch {
        const code = module.output[0]?.data?.code ?? ''
        shakenModules.set(path, { code })
      }
    }

    if (totalRemoved > 0) {
      console.log(`[facetpack] Tree-shaking removed ${totalRemoved} unused exports`)
    }

    if (existingSerializer) {
      const shakenGraph = createShakenGraph(graph, shakenModules)
      return existingSerializer(entryPoint, preModules, shakenGraph, options)
    }

    return defaultSerialize(entryPoint, preModules, graph, options, shakenModules)
  }
}

function computeUsedExports(
  entryPoint: string,
  analyses: Map<string, ModuleAnalysis>,
  graph: SerializerGraph
): Map<string, Set<string>> {
  const used = new Map<string, Set<string>>()
  const visited = new Set<string>()

  function visit(modulePath: string, importedNames: string[]) {
    let moduleUsed = used.get(modulePath)
    if (!moduleUsed) {
      moduleUsed = new Set()
      used.set(modulePath, moduleUsed)
    }

    for (const name of importedNames) {
      moduleUsed.add(name)
    }

    if (visited.has(modulePath)) {
      return
    }
    visited.add(modulePath)

    const analysis = analyses.get(modulePath)
    if (!analysis) {
      return
    }

    for (const imp of analysis.imports) {
      const module = graph.dependencies.get(modulePath)
      if (!module) continue

      const resolvedPath = module.dependencies.get(imp.source)
      if (resolvedPath) {
        visit(resolvedPath, imp.specifiers)
      }
    }

    for (const exp of analysis.exports) {
      if (exp.isReexport && exp.source) {
        const module = graph.dependencies.get(modulePath)
        if (!module) continue

        const resolvedPath = module.dependencies.get(exp.source)
        if (resolvedPath && moduleUsed.has(exp.name)) {
          visit(resolvedPath, [exp.name === '*' ? '*' : exp.name])
        }
      }
    }
  }

  visit(entryPoint, ['*'])

  return used
}

function createShakenGraph(
  originalGraph: SerializerGraph,
  shakenModules: Map<string, { code: string; map?: string }>
): SerializerGraph {
  const newDependencies = new Map<string, SerializerModule>()

  for (const [path, module] of originalGraph.dependencies) {
    const shaken = shakenModules.get(path)
    if (shaken) {
      newDependencies.set(path, {
        ...module,
        output: [
          {
            data: {
              code: shaken.code,
              map: shaken.map,
            },
          },
        ],
      })
    }
  }

  return {
    dependencies: newDependencies,
    entryPoints: originalGraph.entryPoints,
  }
}

function defaultSerialize(
  entryPoint: string,
  preModules: SerializerModule[],
  graph: SerializerGraph,
  options: SerializerOptions,
  shakenModules?: Map<string, { code: string; map?: string }>
): { code: string; map: string } {
  const modules: string[] = []
  let moduleId = 0
  const moduleIds = new Map<string, number>()

  for (const module of preModules) {
    const code = module.output[0]?.data?.code ?? ''
    const id = options.createModuleId?.(module.path) ?? moduleId++
    moduleIds.set(module.path, id)
    modules.push(wrapModule(id, code))
  }

  for (const [path] of graph.dependencies) {
    const shaken = shakenModules?.get(path)
    const module = graph.dependencies.get(path)
    const code = shaken?.code ?? module?.output[0]?.data?.code ?? ''
    const id = options.createModuleId?.(path) ?? moduleId++
    moduleIds.set(path, id)
    modules.push(wrapModule(id, code))
  }

  const entryId = moduleIds.get(entryPoint) ?? 0
  const runStatement = options.getRunModuleStatement?.(entryId) ?? `__r(${entryId});`

  const bundleCode = modules.join('\n') + '\n' + runStatement

  return {
    code: bundleCode,
    map: '{"version":3,"sources":[],"mappings":""}',
  }
}

function wrapModule(id: number, code: string): string {
  return `__d(function(g,r,i,a,m,e,d){${code}},${id});`
}

export default createFacetpackSerializer
