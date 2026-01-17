import { transformSync, JsxRuntime, resolveBatchSync, parseSync } from '@ecrindigital/facetpack-native'
import { parse } from '@babel/parser'
import type { TransformParams, TransformResult, FacetpackOptions } from './types'
import { setCachedResolutions } from './cache'
import { globalStats } from './stats'

type TransformDecision = 'oxc' | 'babel'

interface Transformer {
  transform: (params: TransformParams) => TransformResult
}

const ANSI = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
} as const

const IMPORT_REGEX = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g
const REQUIRE_REGEX = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g

const BABEL_REQUIRED_PATTERNS: readonly RegExp[] = [
  /'worklet'/,
  /"worklet"/,
  /require\.context\s*\(/,
  /useAnimatedStyle/,
  /useAnimatedProps/,
  /useAnimatedScrollHandler/,
  /useAnimatedGestureHandler/,
  /useAnimatedReaction/,
  /useDerivedValue/,
  /useAnimatedSensor/,
  /useFrameCallback/,
  /useScrollViewOffset/,
  /runOnUI/,
  /runOnJS/,
]

const DEFAULT_OPTIONS: Required<FacetpackOptions> = {
  jsx: true,
  jsxRuntime: 'automatic',
  jsxImportSource: 'react',
  jsxPragma: 'React.createElement',
  jsxPragmaFrag: 'React.Fragment',
  typescript: true,
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
  minifier: true,
  treeShake: true,
  noAst: false,
}

class Logger {
  private startupLogged = false

  logStartup(): void {
    if (this.startupLogged || !process.env.FACETPACK_DEBUG) return
    this.startupLogged = true
    console.log(`${ANSI.cyan}${ANSI.bold}[Facetpack]${ANSI.reset} Transformer loaded`)
  }

  logTransform(decision: TransformDecision, filename: string): void {
    if (!process.env.FACETPACK_DEBUG) return
    const color = decision === 'oxc' ? ANSI.green : ANSI.yellow
    console.log(`${color}[Facetpack]${ANSI.reset} ${decision.toUpperCase()}: ${filename}`)
  }

  logFallback(filename: string, error: unknown): void {
    if (!process.env.FACETPACK_DEBUG) return
    const message = error instanceof Error ? error.message : String(error)
    console.log(`${ANSI.yellow}[Facetpack]${ANSI.reset} OXC failed, falling back to Babel: ${filename}`)
    console.log(`${ANSI.yellow}[Facetpack]${ANSI.reset} Error: ${message}`)
  }
}

class OptionsManager {
  private globalOptions: FacetpackOptions = {}

  setGlobal(options: FacetpackOptions): void {
    this.globalOptions = options
  }

  get(): Required<FacetpackOptions> {
    return { ...DEFAULT_OPTIONS, ...this.globalOptions, ...this.getFromEnv() }
  }

  merge(options: FacetpackOptions): Required<FacetpackOptions> {
    return { ...DEFAULT_OPTIONS, ...options }
  }

  private getFromEnv(): FacetpackOptions {
    try {
      const json = process.env.FACETPACK_OPTIONS
      return json ? JSON.parse(json) : {}
    } catch {
      return {}
    }
  }
}

class FallbackTransformerManager {
  private instance: Transformer | null = null

  get(): Transformer {
    if (this.instance) return this.instance

    const envPath = process.env.FACETPACK_FALLBACK_TRANSFORMER
    if (envPath) {
      try {
        this.instance = require(envPath) as Transformer
        return this.instance
      } catch (e) {
        console.warn(`[Facetpack] Failed to load fallback transformer from ${envPath}:`, e)
      }
    }

    this.instance = {
      transform: ({ src }) => ({ code: src, map: null }),
    }
    return this.instance
  }
}

const logger = new Logger()
const options = new OptionsManager()
const fallback = new FallbackTransformerManager()

logger.logStartup()

function extractSpecifiers(code: string): string[] {
  const specifiers = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = IMPORT_REGEX.exec(code)) !== null) {
    if (match[1]) specifiers.add(match[1])
  }
  while ((match = REQUIRE_REGEX.exec(code)) !== null) {
    if (match[1]) specifiers.add(match[1])
  }

  return Array.from(specifiers)
}

function preResolveImports(filename: string, code: string, sourceExts: string[]): void {
  const specifiers = extractSpecifiers(code)
  if (specifiers.length === 0) return

  const directory = filename.substring(0, filename.lastIndexOf('/'))
  const results = resolveBatchSync(directory, specifiers, {
    extensions: [...sourceExts.map(ext => `.${ext}`), '.json'],
    mainFields: ['react-native', 'browser', 'main'],
    conditionNames: ['react-native', 'import', 'require'],
  })

  const resolutions = new Map<string, string | null>()
  for (let i = 0; i < specifiers.length; i++) {
    const specifier = specifiers[i]
    if (specifier) {
      resolutions.set(specifier, results[i]?.path ?? null)
      if (results[i]?.path) {
        globalStats.recordResolve('facetpack')
      }
    }
  }

  setCachedResolutions(filename, resolutions)
}

function requiresBabelTransform(src: string): boolean {
  return BABEL_REQUIRED_PATTERNS.some(pattern => pattern.test(src))
}

function isNodeModules(filename: string): boolean {
  return filename.includes('node_modules')
}

function getFileExtension(filename: string): string | undefined {
  return filename.split('.').pop()?.toLowerCase()
}

function getTransformDecision(
  filename: string,
  src: string,
  opts: Required<FacetpackOptions>
): TransformDecision {
  if (requiresBabelTransform(src)) return 'babel'
  if (isNodeModules(filename)) return 'babel'

  const ext = getFileExtension(filename)
  if (!ext || !opts.sourceExts.includes(ext)) return 'babel'

  return 'oxc'
}

function formatDiagnostics(diagnostics: Array<{
  formatted?: string
  message?: string
  snippet?: string
  filename?: string
  line?: number
  column?: number
  help?: string
}>): string {
  return diagnostics
    .map(d => {
      if (d.formatted) return d.formatted
      if (!d.message) return ''

      let output = `\n  × ${d.message}\n`
      if (d.snippet) {
        output += `   ╭─[${d.filename}:${d.line}:${d.column}]\n`
        output += ` ${d.line} │ ${d.snippet}\n`
        output += `   ╰────\n`
      }
      if (d.help) output += `  help: ${d.help}\n`
      return output
    })
    .join('\n')
}

function transformWithOxc(
  filename: string,
  src: string,
  opts: Required<FacetpackOptions>,
  isDev: boolean
): TransformResult {
  const parseResult = parseSync(filename, src)

  if (parseResult.errors.length > 0) {
    const error = parseResult.diagnostics.length > 0
      ? new Error(`\n${formatDiagnostics(parseResult.diagnostics)}`)
      : new Error(`Parse error in ${filename}:\n${parseResult.errors.join('\n')}`)
    ;(error as any).isParseError = true
    throw error
  }

  const isClassic = opts.jsxRuntime === 'classic'
  const result = transformSync(filename, src, {
    jsx: opts.jsx,
    jsxRuntime: isClassic ? JsxRuntime.Classic : JsxRuntime.Automatic,
    ...(isClassic
      ? { jsxPragma: opts.jsxPragma, jsxPragmaFrag: opts.jsxPragmaFrag }
      : { jsxImportSource: opts.jsxImportSource }),
    typescript: opts.typescript,
    sourcemap: isDev,
  })

  if (result.errors.length > 0) {
    throw new Error(`Facetpack transform error in ${filename}:\n${result.errors.join('\n')}`)
  }

  preResolveImports(filename, result.code, opts.sourceExts)
  globalStats.flush()

  const ast = parse(result.code, {
    sourceType: 'unambiguous',
    plugins: ['jsx'],
  })

  return { ast }
}

export function setTransformerOptions(opts: FacetpackOptions): void {
  options.setGlobal(opts)
}

export function transform(params: TransformParams): TransformResult {
  const { filename, src, options: metroOptions } = params
  const opts = options.get()

  globalStats.registerExitHandler()

  const decision = getTransformDecision(filename, src, opts)
  globalStats.recordTransform(decision)
  logger.logTransform(decision, filename)

  if (decision === 'babel') {
    return fallback.get().transform(params)
  }

  try {
    return transformWithOxc(filename, src, opts, metroOptions.dev)
  } catch (error) {
    if ((error as any).isParseError) {
      throw error
    }
    logger.logFallback(filename, error)
    globalStats.adjustTransformFallback()
    return fallback.get().transform(params)
  }
}

export function createTransformer(customOptions: FacetpackOptions = {}): Transformer {
  const opts = options.merge(customOptions)

  return {
    transform(params: TransformParams): TransformResult {
      const { filename, src, options: metroOptions } = params
      const decision = getTransformDecision(filename, src, opts)

      globalStats.recordTransform(decision)

      if (decision === 'babel') {
        return fallback.get().transform(params)
      }

      return transformWithOxc(filename, src, opts, metroOptions.dev)
    },
  }
}
