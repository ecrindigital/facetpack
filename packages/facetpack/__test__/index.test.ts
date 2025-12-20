import { test, expect, describe } from 'bun:test'
import { withFacetpack, transform, createTransformer } from '../src/index'

describe('withFacetpack', () => {
  test('should wrap metro config with transformer path', () => {
    const baseConfig = {
      transformer: {},
      resolver: {
        sourceExts: ['js'],
      },
    }

    const result = withFacetpack(baseConfig)

    expect(result.transformer?.babelTransformerPath).toBeDefined()
    expect(result.transformer?.babelTransformerPath).toContain('transformer')
  })

  test('should merge source extensions', () => {
    const baseConfig = {
      resolver: {
        sourceExts: ['js', 'json'],
      },
    }

    const result = withFacetpack(baseConfig)
    const exts = result.resolver?.sourceExts ?? []

    expect(exts).toContain('js')
    expect(exts).toContain('json')
    expect(exts).toContain('ts')
    expect(exts).toContain('tsx')
  })

  test('should use custom source extensions', () => {
    const baseConfig = {}

    const result = withFacetpack(baseConfig, {
      sourceExts: ['ts', 'tsx'],
    })

    expect(result.resolver?.sourceExts).toEqual(['ts', 'tsx'])
  })
})

describe('transform', () => {
  test('should transform TypeScript to JavaScript', () => {
    const result = transform({
      filename: 'test.ts',
      src: 'const x: number = 42;',
      options: {
        dev: false,
        hot: false,
        minify: false,
        projectRoot: '/test',
        publicPath: '/',
      },
    })

    expect(result.code).toBeDefined()
    expect(result.code).not.toContain(': number')
    expect(result.code).toContain('const x')
  })

  test('should transform JSX to JavaScript', () => {
    const result = transform({
      filename: 'test.tsx',
      src: 'const App = () => <div>Hello</div>;',
      options: {
        dev: false,
        hot: false,
        minify: false,
        projectRoot: '/test',
        publicPath: '/',
      },
    })

    expect(result.code).toBeDefined()
    expect(result.code).not.toContain('<div>')
    expect(result.code).toContain('jsx')
  })

  test('should skip non-transformable files', () => {
    const src = '{"key": "value"}'
    const result = transform({
      filename: 'test.json',
      src,
      options: {
        dev: false,
        hot: false,
        minify: false,
        projectRoot: '/test',
        publicPath: '/',
      },
    })

    expect(result.code).toBe(src)
    expect(result.map).toBeNull()
  })
})

describe('createTransformer', () => {
  test('should create a transformer with custom options', () => {
    const transformer = createTransformer({
      jsxRuntime: 'classic',
    })

    const result = transformer.transform({
      filename: 'test.tsx',
      src: 'const App = () => <div>Hello</div>;',
      options: {
        dev: false,
        hot: false,
        minify: false,
        projectRoot: '/test',
        publicPath: '/',
      },
    })

    expect(result.code).toBeDefined()
    expect(result.code).toContain('React.createElement')
  })
})
