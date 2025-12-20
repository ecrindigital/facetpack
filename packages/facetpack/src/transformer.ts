import { transformSync, JsxRuntime } from 'facetpack-native'
import { parse } from '@babel/parser'
import type { TransformParams, TransformResult, FacetpackOptions } from './types'

const defaultOptions: Required<FacetpackOptions> = {
  jsx: true,
  jsxRuntime: 'automatic',
  jsxImportSource: 'react',
  jsxPragma: 'React.createElement',
  jsxPragmaFrag: 'React.Fragment',
  typescript: true,
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
}

let globalOptions: FacetpackOptions = {}

let fallbackTransformer: { transform: (params: TransformParams) => TransformResult } | null = null

function getFallbackTransformer(): { transform: (params: TransformParams) => TransformResult } {
  if (fallbackTransformer) {
    return fallbackTransformer
  }

  const transformerPaths = [
    '@expo/metro-config/babel-transformer',
    '@react-native/metro-babel-transformer',
    'metro-react-native-babel-transformer',
  ]

  for (const transformerPath of transformerPaths) {
    try {
      fallbackTransformer = require(transformerPath)
      return fallbackTransformer!
    } catch {
    }
  }

  fallbackTransformer = {
    transform: ({ src }: TransformParams) => ({ code: src, map: null }),
  }
  return fallbackTransformer
}

export function setTransformerOptions(options: FacetpackOptions): void {
  globalOptions = options
}

function getOptions(): Required<FacetpackOptions> {
  return { ...defaultOptions, ...globalOptions }
}

function isNodeModules(filename: string): boolean {
  return filename.includes('node_modules')
}

function shouldTransform(filename: string, options: Required<FacetpackOptions>): boolean {
  if (isNodeModules(filename)) {
    return false
  }

  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return false
  return options.sourceExts.includes(ext)
}

export function transform(params: TransformParams): TransformResult {
  const { filename, src, options: metroOptions } = params
  const opts = getOptions()

  if (process.env.FACETPACK_DEBUG) {
    console.log(`[Facetpack] Processing: ${filename}`)
  }

  if (!shouldTransform(filename, opts)) {
    if (process.env.FACETPACK_DEBUG) {
      console.log(`[Facetpack] Fallback: ${filename}`)
    }
    return getFallbackTransformer().transform(params)
  }

  if (process.env.FACETPACK_DEBUG) {
    console.log(`[Facetpack] OXC Transform: ${filename}`)
  }

  try {
    const isClassic = opts.jsxRuntime === 'classic'
    const result = transformSync(filename, src, {
      jsx: opts.jsx,
      jsxRuntime: isClassic ? JsxRuntime.Classic : JsxRuntime.Automatic,
      ...(isClassic
        ? { jsxPragma: opts.jsxPragma, jsxPragmaFrag: opts.jsxPragmaFrag }
        : { jsxImportSource: opts.jsxImportSource }),
      typescript: opts.typescript,
      sourcemap: metroOptions.dev,
    })

    if (result.errors.length > 0) {
      const errorMessage = result.errors.join('\n')
      throw new Error(`Facetpack transform error in ${filename}:\n${errorMessage}`)
    }

    const ast = parse(result.code, {
      sourceType: 'unambiguous',
      plugins: ['jsx'],
    })

    const output = {
      ast,
      code: result.code,
      map: result.map ? JSON.parse(result.map) : null,
    }

    if (process.env.FACETPACK_DEBUG) {
      console.log(`[Facetpack] Output for ${filename}:`)
      console.log(result.code.slice(0, 500))
    }

    return output
  } catch (error) {
    if (error instanceof Error) {
      error.message = `[Facetpack] ${error.message}`
    }
    throw error
  }
}

export function createTransformer(options: FacetpackOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  return {
    transform(params: TransformParams): TransformResult {
      const { filename, src, options: metroOptions } = params

      if (!shouldTransform(filename, opts)) {
        return getFallbackTransformer().transform(params)
      }

      const isClassic = opts.jsxRuntime === 'classic'
      const result = transformSync(filename, src, {
        jsx: opts.jsx,
        jsxRuntime: isClassic ? JsxRuntime.Classic : JsxRuntime.Automatic,
        ...(isClassic
          ? { jsxPragma: opts.jsxPragma, jsxPragmaFrag: opts.jsxPragmaFrag }
          : { jsxImportSource: opts.jsxImportSource }),
        typescript: opts.typescript,
        sourcemap: metroOptions.dev,
      })

      if (result.errors.length > 0) {
        throw new Error(`Facetpack transform error in ${filename}:\n${result.errors.join('\n')}`)
      }

      return {
        code: result.code,
        map: result.map ? JSON.parse(result.map) : null,
      }
    },
  }
}
