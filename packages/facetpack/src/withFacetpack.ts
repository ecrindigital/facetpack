import type { MetroConfig, FacetpackOptions } from './types'

const DEFAULT_SOURCE_EXTS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']

export function withFacetpack(
  config: MetroConfig,
  options: FacetpackOptions = {}
): MetroConfig {
  const sourceExts = options.sourceExts ?? DEFAULT_SOURCE_EXTS
  const transformerPath = require.resolve('facetpack/transformer')

  storeTransformerOptions(options)

  return {
    ...config,
    transformer: {
      ...config.transformer,
      babelTransformerPath: transformerPath,
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
    },
  }
}

function storeTransformerOptions(options: FacetpackOptions): void {
  process.env.FACETPACK_OPTIONS = JSON.stringify(options)
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
