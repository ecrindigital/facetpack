import { describe, test, expect } from 'bun:test'
import { checkBunInstalled } from '../check-bun-installed.check'
import type { CheckContext } from '../types'

const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }

describe('check-bun-installed', () => {
  test('should detect bun installation', async () => {
    const result = await checkBunInstalled.run(ctx)
    expect(result).toBeDefined()
    expect(result?.label).toContain('bun')
  })

  test('should return success when bun is installed', async () => {
    const result = await checkBunInstalled.run(ctx)
    expect(result?.status).toBe('success')
  })

  test('should have correct category', () => {
    expect(checkBunInstalled.category).toBe('Environment')
  })
})
