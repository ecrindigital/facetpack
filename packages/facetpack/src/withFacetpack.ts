import type { MetroConfig, FacetpackOptions, MinifierConfig } from './types'
import { resolveSync } from '@ecrindigital/facetpack-native'
import { getCachedResolution } from './cache'
import { createFacetpackSerializer, type CustomSerializer } from './serializer'
import { createRequire } from 'module'
import { join } from 'path'

const DEFAULT_SOURCE_EXTS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']

const require = createRequire(import.meta.url)

function findFallbackTransformer(projectRoot: string): string | undefined {
  const projectRequire = createRequire(join(projectRoot, 'package.json'))

  const transformerPaths = [
    '@expo/metro-config/babel-transformer',
    '@react-native/metro-babel-transformer',
    'metro-react-native-babel-transformer',
  ]

  for (const transformerPath of transformerPaths) {
    try {
      return projectRequire.resolve(transformerPath)
    } catch {
    }
  }

  return undefined
}

export function withFacetpack(
  config: MetroConfig,
  options: FacetpackOptions = {}
): MetroConfig {
  const sourceExts = options.sourceExts ?? DEFAULT_SOURCE_EXTS
  const transformerPath = require.resolve('@ecrindigital/facetpack/transformer')

  const useMinifier = options.minifier !== false
  const minifierPath = useMinifier
    ? require.resolve('@ecrindigital/facetpack/minifier')
    : config.transformer?.minifierPath
  const minifierConfig: MinifierConfig = typeof options.minifier === 'object'
    ? options.minifier
    : {}

  const useTreeShake = options.treeShake !== false
  const existingSerializer = (config as any).serializer?.customSerializer as CustomSerializer | undefined
  const customSerializer = useTreeShake
    ? createFacetpackSerializer(existingSerializer, { treeShake: true })
    : existingSerializer

  const projectRoot = (config as any).projectRoot || process.cwd()
  const originalTransformerPath = config.transformer?.babelTransformerPath
  const fallbackTransformerPath = originalTransformerPath || findFallbackTransformer(projectRoot)

  storeTransformerOptions(options, fallbackTransformerPath)

  return {
    ...config,
    transformer: {
      ...config.transformer,
      babelTransformerPath: transformerPath,
      minifierPath,
      minifierConfig,
      getTransformOptions: async (
        entryPoints: readonly string[],
        opts: { dev: boolean; hot: boolean; platform?: string },
        getDepsOf: (path: string) => Promise<string[]>
      ) => {
        const baseOptions = await config.transformer?.getTransformOptions?.(
          entryPoints,
          opts,
          getDepsOf
        )

        return {
          ...baseOptions,
          transform: {
            ...baseOptions?.transform,
            experimentalImportSupport: true,
            inlineRequires: true,
          },
        }
      },
    },
    resolver: {
      ...config.resolver,
      sourceExts: [
        ...new Set([
          ...(config.resolver?.sourceExts ?? []),
          ...sourceExts,
        ]),
      ],
      resolveRequest: (context: any, moduleName: string, platform: string | null) => {
        if (context.originModulePath.includes('node_modules')) {
          return context.resolveRequest(context, moduleName, platform)
        }

        const cached = getCachedResolution(context.originModulePath, moduleName)
        if (cached !== undefined) {
          if (cached) {
            return { type: 'sourceFile', filePath: cached }
          }
          return context.resolveRequest(context, moduleName, platform)
        }

        const directory = context.originModulePath.substring(
          0,
          context.originModulePath.lastIndexOf('/')
        )

        const result = resolveSync(directory, moduleName, {
          extensions: [...sourceExts.map(ext => `.${ext}`), '.json'],
          mainFields: ['react-native', 'browser', 'main'],
          conditionNames: ['react-native', 'import', 'require'],
        })

        if (result.path) {
          return { type: 'sourceFile', filePath: result.path }
        }

        return context.resolveRequest(context, moduleName, platform)
      },
    },
    serializer: {
      ...(config as any).serializer,
      customSerializer,
    },
  }
}

function storeTransformerOptions(options: FacetpackOptions, fallbackTransformerPath?: string): void {
  process.env.FACETPACK_OPTIONS = JSON.stringify(options)
  if (fallbackTransformerPath) {
    process.env.FACETPACK_FALLBACK_TRANSFORMER = fallbackTransformerPath
  }
}

export function getStoredOptions(): FacetpackOptions {
  try {
    const optionsJson = process.env.FACETPACK_OPTIONS
    if (optionsJson) {
      return JSON.parse(optionsJson)
    }
  } catch {
  }
  return {}
}
