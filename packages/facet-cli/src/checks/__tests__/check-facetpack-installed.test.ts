import { describe, test, expect } from 'bun:test'
import { checkFacetpackInstalled } from '../check-facetpack-installed.check'
import type { CheckContext } from '../types'

describe('check-facetpack-installed', () => {
  test('should error when package.json is missing', async () => {
    const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }
    const result = await checkFacetpackInstalled.run(ctx)

    expect(result?.status).toBe('error')
    expect(result?.label).toBe('package.json')
  })

  test('should pass when facetpack is in dependencies', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: { '@ecrindigital/facetpack': '^0.1.0' } },
      fix: false,
    }
    const result = await checkFacetpackInstalled.run(ctx)

    expect(result?.status).toBe('success')
    expect(result?.label).toContain('0.1.0')
  })

  test('should pass when facetpack is in devDependencies', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { devDependencies: { '@ecrindigital/facetpack': '~0.2.0' } },
      fix: false,
    }
    const result = await checkFacetpackInstalled.run(ctx)

    expect(result?.status).toBe('success')
  })

  test('should error when facetpack is not installed', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: {} },
      fix: false,
    }
    const result = await checkFacetpackInstalled.run(ctx)

    expect(result?.status).toBe('error')
    expect(result?.detail).toBe('Not installed')
  })

  test('should strip version prefixes', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: { '@ecrindigital/facetpack': '^1.2.3' } },
      fix: false,
    }
    const result = await checkFacetpackInstalled.run(ctx)

    expect(result?.label).toContain('1.2.3')
    expect(result?.label).not.toContain('^')
  })

  test('should have correct category', () => {
    expect(checkFacetpackInstalled.category).toBe('Installation')
  })
})
