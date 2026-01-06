import { describe, test, expect } from 'bun:test'
import { packages } from '../packages'
import type { RuleContext } from '../../types'

const mockContext = (deps: Record<string, string> = {}): RuleContext => ({
  cwd: '/test/project',
  packageJson: {
    dependencies: deps,
  },
  fix: false,
})

describe('packages checks', () => {
  describe('no package.json', () => {
    test('should return empty results when packageJson is null', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: null,
        fix: false,
      }

      const results = await packages.checks(ctx)

      expect(results).toHaveLength(0)
    })
  })

  describe('expo', () => {
    test('should pass for compatible expo version (54)', async () => {
      const results = await packages.checks(mockContext({ expo: '^54.0.0' }))
      const expoCheck = results.find(r => r.label.includes('expo@'))

      expect(expoCheck).toBeDefined()
      expect(expoCheck?.status).toBe('success')
      expect(expoCheck?.detail).toBe('Compatible')
    })

    test('should pass for compatible expo version (53)', async () => {
      const results = await packages.checks(mockContext({ expo: '~53.0.0' }))
      const expoCheck = results.find(r => r.label.includes('expo@'))

      expect(expoCheck?.status).toBe('success')
    })

    test('should warn for incompatible expo version', async () => {
      const results = await packages.checks(mockContext({ expo: '51.0.0' }))
      const expoCheck = results.find(r => r.label.includes('expo@'))

      expect(expoCheck?.status).toBe('warning')
      expect(expoCheck?.detail).toContain('May not be compatible')
    })
  })

  describe('react-native', () => {
    test('should pass for compatible RN version (0.81)', async () => {
      const results = await packages.checks(mockContext({ 'react-native': '0.81.5' }))
      const rnCheck = results.find(r => r.label.includes('react-native@'))

      expect(rnCheck?.status).toBe('success')
    })

    test('should pass for compatible RN version (0.79)', async () => {
      const results = await packages.checks(mockContext({ 'react-native': '^0.79.0' }))
      const rnCheck = results.find(r => r.label.includes('react-native@'))

      expect(rnCheck?.status).toBe('success')
    })

    test('should warn for incompatible RN version', async () => {
      const results = await packages.checks(mockContext({ 'react-native': '0.72.0' }))
      const rnCheck = results.find(r => r.label.includes('react-native@'))

      expect(rnCheck?.status).toBe('warning')
      expect(rnCheck?.detail).toContain('0.79, 0.80, 0.81')
    })
  })

  describe('react-native-reanimated', () => {
    test('should warn with babel fallback message for reanimated', async () => {
      const results = await packages.checks(mockContext({ 'react-native-reanimated': '^3.6.0' }))
      const reanimatedCheck = results.find(r => r.label.includes('reanimated'))

      expect(reanimatedCheck).toBeDefined()
      expect(reanimatedCheck?.status).toBe('warning')
      expect(reanimatedCheck?.detail).toContain('Babel fallback')
    })
  })

  describe('nativewind', () => {
    test('should pass for compatible nativewind version', async () => {
      const results = await packages.checks(mockContext({ nativewind: '^4.0.0' }))
      const nativewindCheck = results.find(r => r.label.includes('nativewind'))

      expect(nativewindCheck?.status).toBe('success')
    })

    test('should warn for incompatible nativewind version', async () => {
      const results = await packages.checks(mockContext({ nativewind: '2.0.0' }))
      const nativewindCheck = results.find(r => r.label.includes('nativewind'))

      expect(nativewindCheck?.status).toBe('warning')
    })
  })

  describe('multiple packages', () => {
    test('should detect multiple packages', async () => {
      const results = await packages.checks(mockContext({
        expo: '54.0.0',
        'react-native': '0.81.0',
        nativewind: '4.0.0',
      }))

      expect(results.length).toBe(3)
    })
  })

  describe('unknown packages', () => {
    test('should ignore unknown packages', async () => {
      const results = await packages.checks(mockContext({
        'some-random-package': '1.0.0',
        lodash: '4.17.0',
      }))

      expect(results).toHaveLength(0)
    })
  })

  describe('version cleaning', () => {
    test('should clean version prefixes', async () => {
      const results = await packages.checks(mockContext({ expo: '^54.0.30' }))
      const expoCheck = results.find(r => r.label.includes('expo@'))

      expect(expoCheck?.label).toBe('expo@54.0.30')
      expect(expoCheck?.label).not.toContain('^')
    })
  })
})
