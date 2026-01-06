import { describe, test, expect } from 'bun:test'
import { checkRuntimeTransform } from '../check-runtime-transform.check'
import type { CheckContext } from '../types'

const ctx: CheckContext = { cwd: '/test', packageJson: {}, fix: false }

describe('check-runtime-transform', () => {
  test('should return success', async () => {
    const result = await checkRuntimeTransform.run(ctx)
    expect(result?.status).toBe('success')
  })

  test('should include timing in label', async () => {
    const result = await checkRuntimeTransform.run(ctx)
    expect(result?.label).toMatch(/Transform: \d+\.\d+ms/)
  })

  test('should complete in reasonable time', async () => {
    const start = performance.now()
    await checkRuntimeTransform.run(ctx)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(100)
  })

  test('should have correct category', () => {
    expect(checkRuntimeTransform.category).toBe('Runtime')
  })
})
