import { describe, test, expect } from 'bun:test'
import { runtime } from '../runtime'
import type { RuleContext } from '../../types'

const mockContext: RuleContext = {
  cwd: '/test/project',
  packageJson: {},
  fix: false,
}

describe('runtime checks', () => {
  test('should return transform, minify, and resolve checks', async () => {
    const results = await runtime.checks(mockContext)

    expect(results).toHaveLength(3)

    const transformCheck = results.find(r => r.label.includes('Transform'))
    const minifyCheck = results.find(r => r.label.includes('Minify'))
    const resolveCheck = results.find(r => r.label.includes('Resolve'))

    expect(transformCheck).toBeDefined()
    expect(minifyCheck).toBeDefined()
    expect(resolveCheck).toBeDefined()
  })

  test('should have success status for all checks', async () => {
    const results = await runtime.checks(mockContext)

    for (const result of results) {
      expect(result.status).toBe('success')
    }
  })

  test('should include timing in milliseconds', async () => {
    const results = await runtime.checks(mockContext)

    for (const result of results) {
      expect(result.label).toMatch(/\d+\.\d+ms/)
    }
  })

  test('transform check should have reasonable timing', async () => {
    const results = await runtime.checks(mockContext)
    const transformCheck = results.find(r => r.label.includes('Transform'))

    const match = transformCheck?.label.match(/(\d+\.\d+)ms/)
    const time = parseFloat(match?.[1] ?? '0')

    expect(time).toBeGreaterThan(0)
    expect(time).toBeLessThan(100)
  })

  test('minify check should have reasonable timing', async () => {
    const results = await runtime.checks(mockContext)
    const minifyCheck = results.find(r => r.label.includes('Minify'))

    const match = minifyCheck?.label.match(/(\d+\.\d+)ms/)
    const time = parseFloat(match?.[1] ?? '0')

    expect(time).toBeGreaterThan(0)
    expect(time).toBeLessThan(100)
  })

  test('resolve check should have reasonable timing', async () => {
    const results = await runtime.checks(mockContext)
    const resolveCheck = results.find(r => r.label.includes('Resolve'))

    const match = resolveCheck?.label.match(/(\d+\.\d+)ms/)
    const time = parseFloat(match?.[1] ?? '0')

    expect(time).toBeGreaterThan(0)
    expect(time).toBeLessThan(100)
  })

  test('should complete in reasonable time', async () => {
    const start = performance.now()
    await runtime.checks(mockContext)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(500)
  })
})
