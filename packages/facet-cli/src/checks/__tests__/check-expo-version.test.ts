import { describe, test, expect } from 'bun:test'
import { checkExpoVersion } from '../check-expo-version.check'
import type { CheckContext } from '../types'

describe('check-expo-version', () => {
  test('should return null when package.json is missing', async () => {
    const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }
    const result = await checkExpoVersion.run(ctx)

    expect(result).toBeNull()
  })

  test('should return null when expo is not installed', async () => {
    const ctx: CheckContext = { cwd: '/test', packageJson: { dependencies: {} }, fix: false }
    const result = await checkExpoVersion.run(ctx)

    expect(result).toBeNull()
  })

  test('should pass for Expo 54', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: { expo: '^54.0.0' } },
      fix: false,
    }
    const result = await checkExpoVersion.run(ctx)

    expect(result?.status).toBe('success')
    expect(result?.detail).toBe('Compatible')
  })

  test('should pass for Expo 53', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: { expo: '~53.0.0' } },
      fix: false,
    }
    const result = await checkExpoVersion.run(ctx)

    expect(result?.status).toBe('success')
  })

  test('should warn for unsupported Expo version', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: { expo: '51.0.0' } },
      fix: false,
    }
    const result = await checkExpoVersion.run(ctx)

    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('May not be compatible')
  })

  test('should have correct category', () => {
    expect(checkExpoVersion.category).toBe('Packages')
  })
})
