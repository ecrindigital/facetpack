import { test, expect, describe, beforeEach, afterEach } from 'bun:test'
import { withFacetpack, getStoredOptions } from '../withFacetpack'
import type { MetroConfig, FacetpackOptions } from '../types'

describe('withFacetpack', () => {
  const originalEnv = process.env.FACETPACK_OPTIONS

  beforeEach(() => {
    delete process.env.FACETPACK_OPTIONS
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.FACETPACK_OPTIONS = originalEnv
    } else {
      delete process.env.FACETPACK_OPTIONS
    }
  })

  describe('basic configuration', () => {
    test('should return a metro config object', () => {
      const baseConfig: MetroConfig = {}
      const result = withFacetpack(baseConfig)

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    test('should preserve existing config properties', () => {
      const baseConfig: MetroConfig = {
        watchFolders: ['/some/path'],
        resetCache: true,
      }
      const result = withFacetpack(baseConfig)

      expect(result.watchFolders).toEqual(['/some/path'])
      expect(result.resetCache).toBe(true)
    })

    test('should set babelTransformerPath in transformer', () => {
      const result = withFacetpack({})

      expect(result.transformer).toBeDefined()
      expect(result.transformer?.babelTransformerPath).toBeDefined()
      expect(result.transformer?.babelTransformerPath).toContain('transformer')
    })
  })

  describe('minifier configuration', () => {
    test('should set minifierPath when minifier is enabled by default', () => {
      const result = withFacetpack({})

      expect(result.transformer?.minifierPath).toBeDefined()
      expect(result.transformer?.minifierPath).toContain('minifier')
    })

    test('should not override minifierPath when minifier is false', () => {
      const baseConfig: MetroConfig = {
        transformer: {
          minifierPath: '/custom/minifier.js',
        },
      }
      const result = withFacetpack(baseConfig, { minifier: false })

      expect(result.transformer?.minifierPath).toBe('/custom/minifier.js')
    })

    test('should set minifierConfig from options', () => {
      const result = withFacetpack({}, {
        minifier: {
          compress: true,
          mangle: true,
          drop_console: true,
        },
      })

      expect(result.transformer?.minifierConfig).toBeDefined()
      expect(result.transformer?.minifierConfig?.compress).toBe(true)
      expect(result.transformer?.minifierConfig?.mangle).toBe(true)
      expect(result.transformer?.minifierConfig?.drop_console).toBe(true)
    })
  })

  describe('resolver configuration', () => {
    test('should configure sourceExts', () => {
      const result = withFacetpack({})

      expect(result.resolver).toBeDefined()
      expect(result.resolver?.sourceExts).toBeDefined()
      expect(Array.isArray(result.resolver?.sourceExts)).toBe(true)
    })

    test('resolveRequest should handle node_modules', () => {
      const result = withFacetpack({})
      const resolveRequest = result.resolver?.resolveRequest as any

      expect(resolveRequest).toBeDefined()

      const mockContext = {
        originModulePath: '/project/node_modules/lib/index.js',
        resolveRequest: (_ctx: any, _name: string, _platform: string | null) => ({
          type: 'sourceFile',
          filePath: '/resolved/path.js',
        }),
      }

      const resolved = resolveRequest(mockContext, 'react', 'ios')
      expect(resolved).toEqual({ type: 'sourceFile', filePath: '/resolved/path.js' })
    })

    test('resolveRequest should use fallback when resolve fails', () => {
      const result = withFacetpack({})
      const resolveRequest = result.resolver?.resolveRequest as any

      const mockContext = {
        originModulePath: '/project/src/App.tsx',
        resolveRequest: (_ctx: any, _name: string, _platform: string | null) => ({
          type: 'sourceFile',
          filePath: '/fallback/path.js',
        }),
      }

      const resolved = resolveRequest(mockContext, 'nonexistent-module-xyz', 'ios')
      expect(resolved).toBeDefined()
    })

    test('resolveRequest should return cached resolution when available', () => {
      const { setCachedResolutions, clearCache } = require('../cache')
      clearCache()

      const resolutions = new Map<string, string | null>([
        ['react', '/node_modules/react/index.js'],
      ])
      setCachedResolutions('/project/src/App.tsx', resolutions)

      const result = withFacetpack({})
      const resolveRequest = result.resolver?.resolveRequest as any

      const mockContext = {
        originModulePath: '/project/src/App.tsx',
        resolveRequest: (_ctx: any, _name: string, _platform: string | null) => ({
          type: 'sourceFile',
          filePath: '/fallback/path.js',
        }),
      }

      const resolved = resolveRequest(mockContext, 'react', 'ios')
      expect(resolved).toEqual({ type: 'sourceFile', filePath: '/node_modules/react/index.js' })

      clearCache()
    })

    test('resolveRequest should use fallback for null cached resolution', () => {
      const { setCachedResolutions, clearCache } = require('../cache')
      clearCache()

      const resolutions = new Map<string, string | null>([
        ['missing', null],
      ])
      setCachedResolutions('/project/src/App.tsx', resolutions)

      const result = withFacetpack({})
      const resolveRequest = result.resolver?.resolveRequest as any

      const mockContext = {
        originModulePath: '/project/src/App.tsx',
        resolveRequest: (_ctx: any, _name: string, _platform: string | null) => ({
          type: 'sourceFile',
          filePath: '/fallback/path.js',
        }),
      }

      const resolved = resolveRequest(mockContext, 'missing', 'ios')
      expect(resolved).toEqual({ type: 'sourceFile', filePath: '/fallback/path.js' })

      clearCache()
    })

    test('should merge with existing sourceExts', () => {
      const baseConfig: MetroConfig = {
        resolver: {
          sourceExts: ['custom'],
        },
      }
      const result = withFacetpack(baseConfig)

      expect(result.resolver?.sourceExts).toContain('custom')
      expect(result.resolver?.sourceExts).toContain('ts')
      expect(result.resolver?.sourceExts).toContain('tsx')
    })

    test('should use custom sourceExts from options', () => {
      const result = withFacetpack({}, {
        sourceExts: ['ts', 'tsx', 'js'],
      })

      expect(result.resolver?.sourceExts).toContain('ts')
      expect(result.resolver?.sourceExts).toContain('tsx')
      expect(result.resolver?.sourceExts).toContain('js')
    })

    test('should set resolveRequest function', () => {
      const result = withFacetpack({})

      expect(result.resolver?.resolveRequest).toBeDefined()
      expect(typeof result.resolver?.resolveRequest).toBe('function')
    })
  })

  describe('serializer configuration', () => {
    test('should set customSerializer when treeShake is enabled', () => {
      const result = withFacetpack({}, { treeShake: true })

      expect((result as any).serializer?.customSerializer).toBeDefined()
    })

    test('should not set customSerializer when treeShake is false', () => {
      const result = withFacetpack({}, { treeShake: false })

      expect((result as any).serializer?.customSerializer).toBeUndefined()
    })

    test('should preserve existing serializer config', () => {
      const baseConfig = {
        serializer: {
          getModulesRunBeforeMainModule: () => [],
        },
      }
      const result = withFacetpack(baseConfig)

      expect((result as any).serializer?.getModulesRunBeforeMainModule).toBeDefined()
    })
  })

  describe('getTransformOptions', () => {
    test('should return transform options with experimentalImportSupport', async () => {
      const result = withFacetpack({})

      const options = await result.transformer?.getTransformOptions?.(
        ['entry.js'],
        { dev: true, hot: true },
        async () => []
      )

      expect(options?.transform?.experimentalImportSupport).toBe(true)
      expect(options?.transform?.inlineRequires).toBe(true)
    })

    test('should merge with base getTransformOptions', async () => {
      const baseConfig: MetroConfig = {
        transformer: {
          getTransformOptions: async () => ({
            transform: {
              customOption: 'value',
            },
          }),
        },
      }
      const result = withFacetpack(baseConfig)

      const options = await result.transformer?.getTransformOptions?.(
        ['entry.js'],
        { dev: true, hot: true },
        async () => []
      )

      expect(options?.transform?.customOption).toBe('value')
      expect(options?.transform?.experimentalImportSupport).toBe(true)
    })
  })

  describe('options storage', () => {
    test('should store options in environment variable', () => {
      withFacetpack({}, { jsx: false, typescript: false })

      expect(process.env.FACETPACK_OPTIONS).toBeDefined()
    })

    test('should store all options correctly', () => {
      const options: FacetpackOptions = {
        jsx: true,
        jsxRuntime: 'classic',
        jsxPragma: 'h',
        typescript: true,
      }
      withFacetpack({}, options)

      const stored = JSON.parse(process.env.FACETPACK_OPTIONS || '{}')
      expect(stored.jsx).toBe(true)
      expect(stored.jsxRuntime).toBe('classic')
      expect(stored.jsxPragma).toBe('h')
    })
  })
})

describe('getStoredOptions', () => {
  const originalEnv = process.env.FACETPACK_OPTIONS

  afterEach(() => {
    if (originalEnv) {
      process.env.FACETPACK_OPTIONS = originalEnv
    } else {
      delete process.env.FACETPACK_OPTIONS
    }
  })

  test('should return empty object when no options stored', () => {
    delete process.env.FACETPACK_OPTIONS

    const result = getStoredOptions()

    expect(result).toEqual({})
  })

  test('should return stored options', () => {
    process.env.FACETPACK_OPTIONS = JSON.stringify({ jsx: true, typescript: false })

    const result = getStoredOptions()

    expect(result.jsx).toBe(true)
    expect(result.typescript).toBe(false)
  })

  test('should return empty object on invalid JSON', () => {
    process.env.FACETPACK_OPTIONS = 'invalid json'

    const result = getStoredOptions()

    expect(result).toEqual({})
  })

  test('should handle complex options', () => {
    const options = {
      jsx: true,
      jsxRuntime: 'automatic' as const,
      jsxImportSource: 'react',
      typescript: true,
      sourceExts: ['ts', 'tsx'],
      minifier: { compress: true },
      treeShake: true,
    }
    process.env.FACETPACK_OPTIONS = JSON.stringify(options)

    const result = getStoredOptions()

    expect(result).toEqual(options)
  })
})
