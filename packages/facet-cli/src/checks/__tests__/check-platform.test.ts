import { describe, test, expect } from 'bun:test'
import { checkPlatform } from '../check-platform.check'
import type { CheckContext } from '../types'

const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }

describe('check-platform', () => {
  test('should detect current platform', async () => {
    const result = await checkPlatform.run(ctx)
    expect(result?.label).toContain(process.platform)
    expect(result?.label).toContain(process.arch)
  })

  test('should return success', async () => {
    const result = await checkPlatform.run(ctx)
    expect(result?.status).toBe('success')
  })

  test('should have correct category', () => {
    expect(checkPlatform.category).toBe('Environment')
  })
})
