import { describe, test, expect } from 'bun:test'
import { installation } from '../installation'
import type { RuleContext } from '../../types'

describe('installation checks', () => {
  describe('package.json missing', () => {
    test('should error when package.json is null', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: null,
        fix: false,
      }

      const results = await installation.checks(ctx)

      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('error')
      expect(results[0].label).toBe('package.json')
      expect(results[0].detail).toBe('Not found')
    })
  })

  describe('@ecrindigital/facetpack', () => {
    test('should pass when facetpack is installed', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: {
          dependencies: {
            '@ecrindigital/facetpack': '^0.1.0',
          },
        },
        fix: false,
      }

      const results = await installation.checks(ctx)
      const facetpackCheck = results.find(r => r.label.includes('@ecrindigital/facetpack'))

      expect(facetpackCheck).toBeDefined()
      expect(facetpackCheck?.status).toBe('success')
      expect(facetpackCheck?.label).toContain('0.1.0')
    })

    test('should error when facetpack is not installed', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: {
          dependencies: {},
        },
        fix: false,
      }

      const results = await installation.checks(ctx)
      const facetpackCheck = results.find(r => r.label.includes('@ecrindigital/facetpack') && !r.label.includes('native'))

      expect(facetpackCheck).toBeDefined()
      expect(facetpackCheck?.status).toBe('error')
      expect(facetpackCheck?.detail).toBe('Not installed')
    })

    test('should detect facetpack in devDependencies', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: {
          devDependencies: {
            '@ecrindigital/facetpack': '~0.2.0',
          },
        },
        fix: false,
      }

      const results = await installation.checks(ctx)
      const facetpackCheck = results.find(r => r.label.includes('@ecrindigital/facetpack') && !r.label.includes('native'))

      expect(facetpackCheck?.status).toBe('success')
      expect(facetpackCheck?.label).toContain('0.2.0')
    })
  })

  describe('@ecrindigital/facetpack-native', () => {
    test('should pass when facetpack-native is installed', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: {
          dependencies: {
            '@ecrindigital/facetpack': '^0.1.0',
            '@ecrindigital/facetpack-native': '^0.1.0',
          },
        },
        fix: false,
      }

      const results = await installation.checks(ctx)
      const nativeCheck = results.find(r => r.label.includes('facetpack-native'))

      expect(nativeCheck).toBeDefined()
      expect(nativeCheck?.status).toBe('success')
    })

    test('should warn when facetpack-native is not installed', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: {
          dependencies: {
            '@ecrindigital/facetpack': '^0.1.0',
          },
        },
        fix: false,
      }

      const results = await installation.checks(ctx)
      const nativeCheck = results.find(r => r.label.includes('facetpack-native'))

      expect(nativeCheck).toBeDefined()
      expect(nativeCheck?.status).toBe('warning')
      expect(nativeCheck?.detail).toContain('Not installed')
    })
  })

  describe('version cleaning', () => {
    test('should strip ^ prefix from version', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: {
          dependencies: {
            '@ecrindigital/facetpack': '^1.2.3',
          },
        },
        fix: false,
      }

      const results = await installation.checks(ctx)
      const check = results.find(r => r.label.includes('@ecrindigital/facetpack'))

      expect(check?.label).toContain('1.2.3')
      expect(check?.label).not.toContain('^')
    })

    test('should strip ~ prefix from version', async () => {
      const ctx: RuleContext = {
        cwd: '/test/project',
        packageJson: {
          dependencies: {
            '@ecrindigital/facetpack': '~1.2.3',
          },
        },
        fix: false,
      }

      const results = await installation.checks(ctx)
      const check = results.find(r => r.label.includes('@ecrindigital/facetpack'))

      expect(check?.label).toContain('1.2.3')
      expect(check?.label).not.toContain('~')
    })
  })
})
