import { test, expect, describe, beforeEach, afterEach } from 'bun:test'
import { transform, createTransformer, setTransformerOptions } from '../transformer'
import type { TransformParams } from '../types'

const originalEnv = { ...process.env }

const createParams = (filename: string, src: string, dev = true): TransformParams => ({
  filename,
  src,
  options: {
    dev,
    hot: false,
    minify: false,
    projectRoot: '/project',
    publicPath: '/assets',
  },
})

describe('transformer', () => {
  beforeEach(() => {
    setTransformerOptions({})
    delete process.env.FACETPACK_DEBUG
  })

  afterEach(() => {
    delete process.env.FACETPACK_DEBUG
  })

  describe('setTransformerOptions', () => {
    test('should set global options', () => {
      setTransformerOptions({ jsx: false })

      expect(() => transform(createParams('test.ts', 'const x = 1;'))).not.toThrow()
    })

    test('should override default options', () => {
      setTransformerOptions({ jsxRuntime: 'classic' })

      const result = transform(createParams('test.tsx', 'const App = () => <div>Hello</div>;'))

      expect(result.code).toContain('createElement')
    })
  })

  describe('transform', () => {
    test('should transform TypeScript code', () => {
      const result = transform(createParams('test.ts', 'const x: number = 1;'))

      expect(result.code).not.toContain(':')
      expect(result.code).toContain('const x = 1')
    })

    test('should transform TSX code', () => {
      const result = transform(createParams('test.tsx', 'const App = () => <div>Hello</div>;'))

      expect(result.code).not.toContain('<div>')
      expect(result.code).toContain('jsx')
    })

    test('should transform JSX code', () => {
      const result = transform(createParams('test.jsx', 'const App = () => <div>Hello</div>;'))

      expect(result.code).not.toContain('<div>')
    })

    test('should transform JavaScript code', () => {
      const result = transform(createParams('test.js', 'const x = 1;'))

      expect(result.code).toContain('const x = 1')
    })

    test('should handle ES modules', () => {
      const code = `
        import React from 'react';
        export const Component = () => <div />;
      `
      const result = transform(createParams('test.tsx', code))

      expect(result.code).toContain('import')
      expect(result.code).toContain('export')
    })

    test('should generate source map in dev mode', () => {
      const result = transform(createParams('test.ts', 'const x = 1;', true))

      expect(result.map).toBeDefined()
    })

    test('should handle complex TypeScript interfaces', () => {
      const code = `
        interface User {
          id: number;
          name: string;
          email?: string;
        }

        const user: User = { id: 1, name: 'Test' };
      `
      const result = transform(createParams('test.ts', code))

      expect(result.code).not.toContain('interface')
      expect(result.code).not.toContain(': User')
    })

    test('should handle type assertions', () => {
      const code = 'const x = (value as string).toUpperCase();'
      const result = transform(createParams('test.ts', code))

      expect(result.code).not.toContain(' as ')
    })

    test('should handle generics', () => {
      const code = 'function identity<T>(arg: T): T { return arg; }'
      const result = transform(createParams('test.ts', code))

      expect(result.code).not.toContain('<T>')
    })

    test('should handle decorators syntax', () => {
      const code = `
        function log(target: any) { return target; }
        class Service {}
      `
      const result = transform(createParams('test.ts', code))

      expect(result.code).toBeDefined()
    })

    test('should handle async/await', () => {
      const code = `
        async function fetchData(): Promise<string> {
          return await fetch('/api').then(r => r.text());
        }
      `
      const result = transform(createParams('test.ts', code))

      expect(result.code).toContain('async')
      expect(result.code).toContain('await')
    })

    test('should handle empty code', () => {
      const result = transform(createParams('test.ts', ''))

      expect(result.code).toBeDefined()
    })

    test('should handle unicode characters', () => {
      const code = 'const emoji = "🚀";'
      const result = transform(createParams('test.ts', code))

      expect(result.code).toContain('🚀')
    })

    test('should handle node_modules files with fallback', () => {
      const result = transform(createParams('/project/node_modules/lib/index.js', 'const x = 1;'))

      expect(result).toBeDefined()
      expect(result.code).toBeDefined()
    })

    test('should use fallback for unsupported extensions', () => {
      const result = transform(createParams('test.unknown', 'const x = 1;'))

      expect(result).toBeDefined()
    })

    test('should handle files without extension', () => {
      const result = transform(createParams('/project/Makefile', 'const x = 1;'))

      expect(result).toBeDefined()
    })

    test('should handle JSX classic runtime', () => {
      setTransformerOptions({ jsxRuntime: 'classic' })
      const result = transform(createParams('test.tsx', '<div>Hello</div>'))

      expect(result.code).toContain('createElement')
    })

    test('should handle JSX automatic runtime', () => {
      setTransformerOptions({ jsxRuntime: 'automatic' })
      const result = transform(createParams('test.tsx', '<div>Hello</div>'))

      expect(result.code).toContain('jsx')
    })

    test('should handle custom jsxImportSource', () => {
      setTransformerOptions({ jsxImportSource: 'preact' })
      const result = transform(createParams('test.tsx', '<div>Hello</div>'))

      expect(result.code).toContain('preact')
    })

    test('should handle spread props in JSX', () => {
      const code = 'const props = { a: 1 }; const App = () => <div {...props} />;'
      const result = transform(createParams('test.tsx', code))

      expect(result.code).toBeDefined()
    })

    test('should handle fragments', () => {
      const code = 'const App = () => <><div /><span /></>;'
      const result = transform(createParams('test.tsx', code))

      expect(result.code).not.toContain('<>')
    })

    test('should handle conditional rendering', () => {
      const code = 'const App = ({ show }) => show ? <div>Yes</div> : <div>No</div>;'
      const result = transform(createParams('test.tsx', code))

      expect(result.code).toBeDefined()
    })

    test('should handle map rendering', () => {
      const code = `
        const items = [1, 2, 3];
        const App = () => <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
      `
      const result = transform(createParams('test.tsx', code))

      expect(result.code).toBeDefined()
    })

    test('should log in debug mode', () => {
      process.env.FACETPACK_DEBUG = 'true'
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: any[]) => logs.push(args.join(' '))

      try {
        transform(createParams('test.ts', 'const x = 1;'))
        expect(logs.some(l => l.includes('[Facetpack]'))).toBe(true)
      } finally {
        console.log = originalLog
      }
    })

    test('should log fallback in debug mode', () => {
      process.env.FACETPACK_DEBUG = 'true'
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: any[]) => logs.push(args.join(' '))

      try {
        transform(createParams('/node_modules/lib/index.js', 'const x = 1;'))
        expect(logs.some(l => l.includes('Fallback'))).toBe(true)
      } finally {
        console.log = originalLog
      }
    })

    test('should throw on transform errors', () => {
      expect(() => {
        transform(createParams('test.ts', 'const x: = 1;'))
      }).toThrow()
    })

    test('should throw with detailed error message on syntax errors', () => {
      try {
        transform(createParams('test.tsx', '<div><span></div>'))
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('[Facetpack]')
      }
    })

    test('should handle require syntax', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');
        module.exports = { fs, path };
      `
      const result = transform(createParams('test.js', code))
      expect(result.code).toContain('require')
    })
  })

  describe('createTransformer', () => {
    test('should create a transformer instance', () => {
      const transformer = createTransformer()

      expect(transformer).toBeDefined()
      expect(typeof transformer.transform).toBe('function')
    })

    test('should create transformer with custom options', () => {
      const transformer = createTransformer({
        jsx: true,
        typescript: true,
        jsxRuntime: 'automatic',
      })

      expect(transformer).toBeDefined()
    })

    test('transformer.transform should transform code', () => {
      const transformer = createTransformer()
      const result = transformer.transform(createParams('test.ts', 'const x: number = 1;'))

      expect(result.code).not.toContain(':')
    })

    test('transformer should use provided options', () => {
      const transformer = createTransformer({ jsxRuntime: 'classic' })
      const result = transformer.transform(createParams('test.tsx', '<div>Hello</div>'))

      expect(result.code).toContain('createElement')
    })

    test('transformer should handle node_modules with fallback', () => {
      const transformer = createTransformer()
      const result = transformer.transform(
        createParams('/project/node_modules/lib/index.js', 'const x = 1;')
      )

      expect(result).toBeDefined()
    })

    test('transformer should generate source map in dev mode', () => {
      const transformer = createTransformer()
      const result = transformer.transform(createParams('test.ts', 'const x = 1;', true))

      expect(result.map).toBeDefined()
    })

    test('transformer should not generate source map in prod mode', () => {
      const transformer = createTransformer()
      const result = transformer.transform(createParams('test.ts', 'const x = 1;', false))

      expect(result.map).toBeNull()
    })
  })
})
