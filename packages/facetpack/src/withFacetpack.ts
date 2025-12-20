import type { MetroConfig, FacetpackOptions } from './types'

/**
 * Default source extensions supported by Facetpack
 */
const DEFAULT_SOURCE_EXTS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']

/**
 * Wrap a Metro configuration with Facetpack transformer
 *
 * @example
 * ```js
 * // metro.config.js
 * const { getDefaultConfig } = require('@react-native/metro-config');
 * const { withFacetpack } = require('facetpack');
 *
 * const config = getDefaultConfig(__dirname);
 * module.exports = withFacetpack(config);
 * ```
 *
 * @example With options
 * ```js
 * module.exports = withFacetpack(config, {
 *   jsxRuntime: 'automatic',
 *   jsxImportSource: 'react',
 * });
 * ```
 */
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
      // Use Facetpack transformer instead of Babel
      babelTransformerPath: transformerPath,
      // Preserve existing transform options
      getTransformOptions: async (
        entryPoints: readonly string[],
        opts: { dev: boolean; hot: boolean; platform?: string },
        getDepsOf: (path: string) => Promise<string[]>
      ) => {
        // Call original getTransformOptions if it exists
        const baseOptions = await config.transformer?.getTransformOptions?.(
          entryPoints,
          opts,
          getDepsOf
        )

        return {
          ...baseOptions,
          transform: {
            ...baseOptions?.transform,
            // Enable experimentalImportSupport for ES modules support
            // This is needed because OXC doesn't transform imports to CommonJS
            experimentalImportSupport: true,
            inlineRequires: true,
          },
        }
      },
    },
    resolver: {
      ...config.resolver,
      // Merge source extensions, avoiding duplicates
      sourceExts: [
        ...new Set([
          ...(config.resolver?.sourceExts ?? []),
          ...sourceExts,
        ]),
      ],
    },
  }
}

/**
 * Store transformer options for the transformer module to access
 * This is needed because Metro loads the transformer in a separate context
 */
function storeTransformerOptions(options: FacetpackOptions): void {
  // Set environment variable for transformer to read
  process.env.FACETPACK_OPTIONS = JSON.stringify(options)
}

/**
 * Get stored transformer options
 * Called by the transformer module
 */
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
