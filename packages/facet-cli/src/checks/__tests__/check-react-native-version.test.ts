import { describe, test, expect } from 'bun:test'
import { checkReactNativeVersion } from '../check-react-native-version.check'
import type { CheckContext } from '../types'

describe('check-react-native-version', () => {
  test('should return null when package.json is missing', async () => {
    const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }
    const result = await checkReactNativeVersion.run(ctx)

    expect(result).toBeNull()
  })

  test('should return null when react-native is not installed', async () => {
    const ctx: CheckContext = { cwd: '/test', packageJson: { dependencies: {} }, fix: false }
    const result = await checkReactNativeVersion.run(ctx)

    expect(result).toBeNull()
  })

  test('should pass for RN 0.81', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: { 'react-native': '0.81.5' } },
      fix: false,
    }
    const result = await checkReactNativeVersion.run(ctx)

    expect(result?.status).toBe('success')
    expect(result?.detail).toBe('Compatible')
  })

  test('should pass for RN 0.79', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: { 'react-native': '^0.79.0' } },
      fix: false,
    }
    const result = await checkReactNativeVersion.run(ctx)

    expect(result?.status).toBe('success')
  })

  test('should warn for unsupported RN version', async () => {
    const ctx: CheckContext = {
      cwd: '/test',
      packageJson: { dependencies: { 'react-native': '0.72.0' } },
      fix: false,
    }
    const result = await checkReactNativeVersion.run(ctx)

    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('0.79, 0.80, 0.81')
  })

  test('should have correct category', () => {
    expect(checkReactNativeVersion.category).toBe('Packages')
  })
})
