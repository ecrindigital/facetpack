import { describe, test, expect } from 'bun:test'
import { checkAndroidSdk } from '../check-android-sdk.check'
import type { CheckContext } from '../types'

const ctx: CheckContext = { cwd: '/test', packageJson: null, fix: false }

describe('check-android-sdk', () => {
  test('should check ANDROID_HOME environment variable', async () => {
    const result = await checkAndroidSdk.run(ctx)

    expect(result).toBeDefined()
    expect(result?.label).toContain('Android SDK')
  })

  test('should warn if ANDROID_HOME is not set', async () => {
    const originalAndroidHome = process.env.ANDROID_HOME
    const originalAndroidSdkRoot = process.env.ANDROID_SDK_ROOT

    delete process.env.ANDROID_HOME
    delete process.env.ANDROID_SDK_ROOT

    const result = await checkAndroidSdk.run(ctx)

    process.env.ANDROID_HOME = originalAndroidHome
    process.env.ANDROID_SDK_ROOT = originalAndroidSdkRoot

    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('ANDROID_HOME')
  })

  test('should have correct category', () => {
    expect(checkAndroidSdk.category).toBe('Environment')
  })
})
