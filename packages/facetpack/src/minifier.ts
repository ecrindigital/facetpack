import { minifySync, type MinifyOptions as NativeMinifyOptions } from '@ecrindigital/facetpack-native'
import { globalStats } from './stats'

export interface MinifierConfig {
  compress?: boolean
  mangle?: boolean
  keep_fnames?: boolean
  drop_console?: boolean
  drop_debugger?: boolean
}

interface MetroMinifyInput {
  code: string
  map?: string
  filename: string
  reserved?: string[]
  config: MinifierConfig
}

interface MetroMinifyOutput {
  code: string
  map?: string
}

export function minify(input: MetroMinifyInput): MetroMinifyOutput {
  const options: NativeMinifyOptions = {
    compress: input.config.compress ?? true,
    mangle: input.config.mangle ?? true,
    keepFnames: input.config.keep_fnames ?? false,
    dropConsole: input.config.drop_console ?? false,
    dropDebugger: input.config.drop_debugger ?? true,
    sourcemap: input.map !== undefined,
  }

  const originalSize = Buffer.byteLength(input.code, 'utf8')
  const result = minifySync(input.code, input.filename, options)
  const minifiedSize = Buffer.byteLength(result.code, 'utf8')

  globalStats.recordMinify(originalSize, minifiedSize)

  return {
    code: result.code,
    map: result.map ?? undefined,
  }
}

export function minifyCode(
  code: string,
  filename: string,
  options?: MinifierConfig
): MetroMinifyOutput {
  const nativeOptions: NativeMinifyOptions = {
    compress: options?.compress ?? true,
    mangle: options?.mangle ?? true,
    keepFnames: options?.keep_fnames ?? false,
    dropConsole: options?.drop_console ?? false,
    dropDebugger: options?.drop_debugger ?? true,
    sourcemap: false,
  }

  const originalSize = Buffer.byteLength(code, 'utf8')
  const result = minifySync(code, filename, nativeOptions)
  const minifiedSize = Buffer.byteLength(result.code, 'utf8')

  globalStats.recordMinify(originalSize, minifiedSize)

  return {
    code: result.code,
    map: result.map ?? undefined,
  }
}

export default minify
