import { describe, test, expect } from 'bun:test'
import { checkCocoapodsVersion } from '../check-cocoapods-version.check'
import type { CheckContext } from '../types'

const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }

describe('check-cocoapods-version', () => {
  test('should return null on non-darwin platforms', async () => {
    if (process.platform !== 'darwin') {
      const result = await checkCocoapodsVersion.run(ctx)
      expect(result).toBeNull()
    }
  })

  test('should check for CocoaPods on macOS', async () => {
    if (process.platform === 'darwin') {
      const result = await checkCocoapodsVersion.run(ctx)
      expect(result).toBeDefined()
      expect(result?.label).toContain('CocoaPods')
    }
  })

  test('should have correct category', () => {
    expect(checkCocoapodsVersion.category).toBe('Environment')
  })
})
