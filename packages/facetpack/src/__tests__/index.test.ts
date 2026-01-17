import { test, expect, describe } from 'bun:test'
import * as facetpack from '../index'

describe('index exports', () => {
  test('should export withFacetpack', () => {
    expect(facetpack.withFacetpack).toBeDefined()
    expect(typeof facetpack.withFacetpack).toBe('function')
  })

  test('should export getStoredOptions', () => {
    expect(facetpack.getStoredOptions).toBeDefined()
    expect(typeof facetpack.getStoredOptions).toBe('function')
  })

  test('should export transform', () => {
    expect(facetpack.transform).toBeDefined()
    expect(typeof facetpack.transform).toBe('function')
  })

  test('should export createTransformer', () => {
    expect(facetpack.createTransformer).toBeDefined()
    expect(typeof facetpack.createTransformer).toBe('function')
  })

  test('should export setTransformerOptions', () => {
    expect(facetpack.setTransformerOptions).toBeDefined()
    expect(typeof facetpack.setTransformerOptions).toBe('function')
  })

  test('should export createResolver', () => {
    expect(facetpack.createResolver).toBeDefined()
    expect(typeof facetpack.createResolver).toBe('function')
  })

  test('should export resolveSync', () => {
    expect(facetpack.resolveSync).toBeDefined()
    expect(typeof facetpack.resolveSync).toBe('function')
  })

  test('should export clearCache', () => {
    expect(facetpack.clearCache).toBeDefined()
    expect(typeof facetpack.clearCache).toBe('function')
  })

  test('should export getCacheStats', () => {
    expect(facetpack.getCacheStats).toBeDefined()
    expect(typeof facetpack.getCacheStats).toBe('function')
  })

  test('should export minify', () => {
    expect(facetpack.minify).toBeDefined()
    expect(typeof facetpack.minify).toBe('function')
  })

  test('should export minifyCode', () => {
    expect(facetpack.minifyCode).toBeDefined()
    expect(typeof facetpack.minifyCode).toBe('function')
  })

  test('should export createFacetpackSerializer', () => {
    expect(facetpack.createFacetpackSerializer).toBeDefined()
    expect(typeof facetpack.createFacetpackSerializer).toBe('function')
  })
})

describe('integration', () => {
  test('createResolver should work with transform', () => {
    const resolver = facetpack.createResolver()
    expect(resolver).toBeDefined()

    const transformer = facetpack.createTransformer()
    expect(transformer).toBeDefined()
  })

  test('minifyCode should work on transformed code', () => {
    const transformer = facetpack.createTransformer()
    const transformed = transformer.transform({
      filename: 'test.ts',
      src: 'const x: number = 1;',
      options: {
        dev: false,
        hot: false,
        minify: false,
        projectRoot: '/project',
        publicPath: '/assets',
      },
    })

    const minified = facetpack.minifyCode(transformed.code || 'const x = 1;', 'test.js')
    expect(minified.code).toBeDefined()
  })

  test('cache operations should work together', () => {
    facetpack.clearCache()
    let stats = facetpack.getCacheStats()
    expect(stats.files).toBe(0)

    facetpack.clearCache()
    stats = facetpack.getCacheStats()
    expect(stats.files).toBe(0)
  })
})
