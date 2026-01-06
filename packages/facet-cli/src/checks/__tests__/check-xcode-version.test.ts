import { describe, test, expect } from 'bun:test'
import { checkXcodeVersion } from '../check-xcode-version.check'
import type { CheckContext } from '../types'

const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }

describe('check-xcode-version', () => {
  test('should return null on non-darwin platforms', async () => {
    if (process.platform !== 'darwin') {
      const result = await checkXcodeVersion.run(ctx)
      expect(result).toBeNull()
    }
  })

  test('should detect Xcode on macOS', async () => {
    if (process.platform === 'darwin') {
      const result = await checkXcodeVersion.run(ctx)
      expect(result).toBeDefined()
      expect(result?.label).toContain('Xcode')
    }
  })

  test('should have correct category', () => {
    expect(checkXcodeVersion.category).toBe('Environment')
  })
})
