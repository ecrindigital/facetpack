import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { checkExpoConfigCommonIssues } from '../check-expo-config-common-issues.check'
import type { CheckContext } from '../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-expo-common'

const ctx = (): CheckContext => ({
  cwd: TEST_DIR,
  packageJson: null,
  fix: false,
})

describe('check-expo-config-common-issues', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
    mkdirSync(join(TEST_DIR, 'assets'), { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  test('should have correct metadata', () => {
    expect(checkExpoConfigCommonIssues.name).toBe('expo-config-common-issues')
    expect(checkExpoConfigCommonIssues.category).toBe('Installation')
  })

  test('should return null when app.json does not exist', async () => {
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result).toBeNull()
  })

  test('should return null when expo key is missing', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({ name: 'test' }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result).toBeNull()
  })

  test('should warn on invalid iOS bundleIdentifier format', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        ios: { bundleIdentifier: 'invalid' }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Invalid iOS bundleIdentifier')
  })

  test('should warn on com.example placeholder in iOS bundleIdentifier', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        ios: { bundleIdentifier: 'com.example.myapp' }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('placeholder')
  })

  test('should warn on invalid Android package format', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        android: { package: '123invalid' }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Invalid Android package')
  })

  test('should warn on com.example placeholder in Android package', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        android: { package: 'com.example.myapp' }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('placeholder')
  })

  test('should warn when icon file does not exist', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        icon: './assets/icon.png'
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Icon not found')
  })

  test('should not warn when icon file exists', async () => {
    writeFileSync(join(TEST_DIR, 'assets', 'icon.png'), '')
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        version: '2.0.0',
        icon: './assets/icon.png',
        ios: { bundleIdentifier: 'com.mycompany.test', buildNumber: '10' },
        android: { package: 'com.mycompany.test' }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('success')
  })

  test('should warn when splash image does not exist', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        splash: { image: './assets/splash.png' }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Splash image not found')
  })

  test('should warn on default version/buildNumber', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        version: '1.0.0',
        ios: { buildNumber: '1' }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('default version')
  })

  test('should show count of additional issues', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        ios: { bundleIdentifier: 'com.example.test' },
        android: { package: 'com.example.test' }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('+')
  })

  test('should return success when no issues found', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        version: '2.0.0',
        ios: {
          bundleIdentifier: 'com.mycompany.myapp',
          buildNumber: '10'
        },
        android: {
          package: 'com.mycompany.myapp'
        }
      }
    }))
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result?.status).toBe('success')
    expect(result?.detail).toContain('No common issues')
  })

  test('should return null on parse error', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), '{ invalid }')
    const result = await checkExpoConfigCommonIssues.run(ctx())
    expect(result).toBeNull()
  })
})
