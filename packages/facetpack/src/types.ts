/**
 * Options for configuring Facetpack transformer
 */
export interface FacetpackOptions {
  /**
   * Enable JSX transformation
   * @default true
   */
  jsx?: boolean

  /**
   * JSX runtime mode
   * - 'automatic': Uses React 17+ JSX transform (recommended)
   * - 'classic': Uses React.createElement
   * @default 'automatic'
   */
  jsxRuntime?: 'automatic' | 'classic'

  /**
   * JSX import source for automatic runtime
   * @default 'react'
   */
  jsxImportSource?: string

  /**
   * JSX pragma for classic runtime
   * @default 'React.createElement'
   */
  jsxPragma?: string

  /**
   * JSX pragma frag for classic runtime
   * @default 'React.Fragment'
   */
  jsxPragmaFrag?: string

  /**
   * Strip TypeScript types
   * @default true
   */
  typescript?: boolean

  /**
   * Source file extensions to transform
   * @default ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']
   */
  sourceExts?: string[]
}

/**
 * Metro transformer configuration
 */
export interface MetroTransformerConfig {
  babelTransformerPath?: string
  getTransformOptions?: (
    entryPoints: readonly string[],
    options: { dev: boolean; hot: boolean; platform?: string },
    getDependenciesOf: (path: string) => Promise<string[]>
  ) => Promise<{
    transform?: {
      experimentalImportSupport?: boolean
      inlineRequires?: boolean | { blockList?: Record<string, string[]> }
      unstable_disableES6Transforms?: boolean
      [key: string]: unknown
    }
    preloadedModules?: Record<string, true>
    ramGroups?: string[]
  }>
  [key: string]: unknown
}

/**
 * Metro resolver configuration
 */
export interface MetroResolverConfig {
  sourceExts?: string[]
  [key: string]: unknown
}

/**
 * Metro configuration type
 * Simplified type for Metro config compatibility
 */
export interface MetroConfig {
  transformer?: MetroTransformerConfig
  resolver?: MetroResolverConfig
  [key: string]: unknown
}

/**
 * Transform parameters passed by Metro
 */
export interface TransformParams {
  filename: string
  src: string
  options: TransformOptions
}

/**
 * Transform options from Metro
 */
export interface TransformOptions {
  dev: boolean
  hot: boolean
  minify: boolean
  platform?: string
  projectRoot: string
  publicPath: string
  customTransformOptions?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Transform result returned to Metro
 */
export interface TransformResult {
  ast?: object
  code: string
  map?: object | null
}
