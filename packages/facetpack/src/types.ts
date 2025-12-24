export interface MinifierConfig {
  compress?: boolean
  mangle?: boolean
  keep_fnames?: boolean
  drop_console?: boolean
  drop_debugger?: boolean
}

export interface FacetpackOptions {
  jsx?: boolean
  jsxRuntime?: 'automatic' | 'classic'
  jsxImportSource?: string
  jsxPragma?: string
  jsxPragmaFrag?: string
  typescript?: boolean
  sourceExts?: string[]
  minifier?: boolean | MinifierConfig
  treeShake?: boolean
}

export interface MetroTransformerConfig {
  babelTransformerPath?: string
  minifierPath?: string
  minifierConfig?: MinifierConfig
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

export interface MetroResolverConfig {
  sourceExts?: string[]
  [key: string]: unknown
}

export interface MetroConfig {
  transformer?: MetroTransformerConfig
  resolver?: MetroResolverConfig
  [key: string]: unknown
}

export interface TransformParams {
  filename: string
  src: string
  options: TransformOptions
}

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

export interface TransformResult {
  ast?: object
  code: string
  map?: object | null
}
