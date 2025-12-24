import { test, expect, describe } from 'bun:test'
import { createResolver, resolveSync } from '../resolver'

describe('resolver', () => {
  describe('createResolver', () => {
    test('should create a resolver instance', () => {
      const resolver = createResolver()

      expect(resolver).toBeDefined()
      expect(typeof resolver.resolve).toBe('function')
    })

    test('should create resolver with custom options', () => {
      const resolver = createResolver({
        extensions: ['.ts', '.tsx', '.js'],
        mainFields: ['main', 'module'],
      })

      expect(resolver).toBeDefined()
    })

    test('resolve should return null for non-existent module', () => {
      const resolver = createResolver()
      const result = resolver.resolve('/some/path/file.ts', 'nonexistent-module-xyz')

      expect(result).toBeNull()
    })

    test('resolve should extract directory from module path', () => {
      const resolver = createResolver()

      expect(() => {
        resolver.resolve('/path/to/module.ts', './relative')
      }).not.toThrow()
    })
  })

  describe('resolveSync', () => {
    test('should be a function', () => {
      expect(typeof resolveSync).toBe('function')
    })

    test('should return an object', () => {
      const result = resolveSync('/some/directory', 'nonexistent-module-abc')

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    test('should handle relative paths', () => {
      const result = resolveSync('/some/directory', './nonexistent-file')

      expect(result).toBeDefined()
    })

    test('should accept custom options', () => {
      const result = resolveSync('/some/directory', 'module', {
        extensions: ['.js', '.ts'],
        mainFields: ['main'],
      })

      expect(result).toBeDefined()
    })
  })
})
