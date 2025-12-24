import { test, expect, beforeEach, describe } from 'bun:test'
import {
  setCachedResolutions,
  getCachedResolution,
  clearCache,
  getCacheStats,
} from '../cache'

describe('cache', () => {
  beforeEach(() => {
    clearCache()
  })

  describe('setCachedResolutions', () => {
    test('should store resolutions for a module', () => {
      const resolutions = new Map<string, string | null>([
        ['react', '/node_modules/react/index.js'],
        ['lodash', '/node_modules/lodash/index.js'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions)

      expect(getCachedResolution('/src/App.tsx', 'react')).toBe('/node_modules/react/index.js')
      expect(getCachedResolution('/src/App.tsx', 'lodash')).toBe('/node_modules/lodash/index.js')
    })

    test('should store null resolutions', () => {
      const resolutions = new Map<string, string | null>([
        ['nonexistent', null],
      ])

      setCachedResolutions('/src/App.tsx', resolutions)

      expect(getCachedResolution('/src/App.tsx', 'nonexistent')).toBeNull()
    })

    test('should overwrite existing resolutions for same module', () => {
      const resolutions1 = new Map<string, string | null>([
        ['react', '/old/path'],
      ])
      const resolutions2 = new Map<string, string | null>([
        ['react', '/new/path'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions1)
      setCachedResolutions('/src/App.tsx', resolutions2)

      expect(getCachedResolution('/src/App.tsx', 'react')).toBe('/new/path')
    })
  })

  describe('getCachedResolution', () => {
    test('should return undefined for unknown module path', () => {
      expect(getCachedResolution('/unknown/path.ts', 'react')).toBeUndefined()
    })

    test('should return undefined for unknown specifier', () => {
      const resolutions = new Map<string, string | null>([
        ['react', '/node_modules/react/index.js'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions)

      expect(getCachedResolution('/src/App.tsx', 'unknown')).toBeUndefined()
    })

    test('should return cached path for known specifier', () => {
      const resolutions = new Map<string, string | null>([
        ['react', '/node_modules/react/index.js'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions)

      expect(getCachedResolution('/src/App.tsx', 'react')).toBe('/node_modules/react/index.js')
    })
  })

  describe('clearCache', () => {
    test('should clear all cached resolutions', () => {
      const resolutions = new Map<string, string | null>([
        ['react', '/node_modules/react/index.js'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions)
      setCachedResolutions('/src/Other.tsx', resolutions)

      clearCache()

      expect(getCachedResolution('/src/App.tsx', 'react')).toBeUndefined()
      expect(getCachedResolution('/src/Other.tsx', 'react')).toBeUndefined()
    })
  })

  describe('getCacheStats', () => {
    test('should return zero stats for empty cache', () => {
      const stats = getCacheStats()

      expect(stats.files).toBe(0)
      expect(stats.resolutions).toBe(0)
    })

    test('should return correct stats after adding resolutions', () => {
      const resolutions1 = new Map<string, string | null>([
        ['react', '/node_modules/react/index.js'],
        ['lodash', '/node_modules/lodash/index.js'],
      ])
      const resolutions2 = new Map<string, string | null>([
        ['axios', '/node_modules/axios/index.js'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions1)
      setCachedResolutions('/src/Other.tsx', resolutions2)

      const stats = getCacheStats()

      expect(stats.files).toBe(2)
      expect(stats.resolutions).toBe(3)
    })

    test('should return correct stats after clearing', () => {
      const resolutions = new Map<string, string | null>([
        ['react', '/node_modules/react/index.js'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions)
      clearCache()

      const stats = getCacheStats()

      expect(stats.files).toBe(0)
      expect(stats.resolutions).toBe(0)
    })
  })

  describe('cache expiration', () => {
    test('should return undefined for expired cache entries', async () => {
      const resolutions = new Map<string, string | null>([
        ['react', '/node_modules/react/index.js'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions)

      expect(getCachedResolution('/src/App.tsx', 'react')).toBe('/node_modules/react/index.js')
    })
  })

  describe('multiple modules', () => {
    test('should handle multiple modules independently', () => {
      const resolutions1 = new Map<string, string | null>([
        ['react', '/path1/react'],
      ])
      const resolutions2 = new Map<string, string | null>([
        ['react', '/path2/react'],
      ])

      setCachedResolutions('/src/App.tsx', resolutions1)
      setCachedResolutions('/src/Other.tsx', resolutions2)

      expect(getCachedResolution('/src/App.tsx', 'react')).toBe('/path1/react')
      expect(getCachedResolution('/src/Other.tsx', 'react')).toBe('/path2/react')
    })
  })
})
