import { describe, test, expect } from 'bun:test'
import { checkPackageManagerVersion } from '../check-package-manager-version.check'
import type { CheckContext } from '../types'

const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }

describe('check-package-manager-version', () => {
  test('should detect at least one package manager', async () => {
    const result = await checkPackageManagerVersion.run(ctx)

    expect(result).toBeDefined()
    expect(result?.status).not.toBe('error')
  })

  test('should prioritize bun', async () => {
    const result = await checkPackageManagerVersion.run(ctx)

    expect(result?.label).toContain('bun')
  })

  test('should have correct category', () => {
    expect(checkPackageManagerVersion.category).toBe('Environment')
  })
})
