import { describe, test, expect } from 'bun:test'
import { checkNodeVersion } from '../check-node-version.check'
import type { CheckContext } from '../types'

const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }

describe('check-node-version', () => {
  test('should return success for Node.js >= 18', async () => {
    const result = await checkNodeVersion.run(ctx)
    expect(result?.status).toBe('success')
  })

  test('should include version in label', async () => {
    const result = await checkNodeVersion.run(ctx)
    expect(result?.label).toMatch(/Node\.js \d+\.\d+\.\d+/)
  })

  test('should have correct category', () => {
    expect(checkNodeVersion.category).toBe('Environment')
  })
})
