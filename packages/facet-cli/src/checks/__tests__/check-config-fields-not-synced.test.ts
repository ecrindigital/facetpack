import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { checkConfigFieldsNotSynced } from '../check-config-fields-not-synced.check'
import type { CheckContext } from '../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-config-sync'

const ctx = (): CheckContext => ({
  cwd: TEST_DIR,
  packageJson: null,
  fix: false,
})

describe('check-config-fields-not-synced', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  test('should have correct metadata', () => {
    expect(checkConfigFieldsNotSynced.name).toBe('config-fields-not-synced')
    expect(checkConfigFieldsNotSynced.category).toBe('Installation')
  })

  test('should return null when app.json does not exist', async () => {
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result).toBeNull()
  })

  test('should return null when no ios or android directories exist', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'Test', slug: 'test' }
    }))
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result).toBeNull()
  })

  test('should return null when expo key is missing', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({ name: 'test' }))
    mkdirSync(join(TEST_DIR, 'ios'), { recursive: true })
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result).toBeNull()
  })

  test('should warn when iOS version is out of sync', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'TestApp', slug: 'test', version: '2.0.0' }
    }))
    mkdirSync(join(TEST_DIR, 'ios', 'TestApp'), { recursive: true })
    writeFileSync(
      join(TEST_DIR, 'ios', 'TestApp', 'Info.plist'),
      `<plist><dict><key>CFBundleShortVersionString</key><string>1.0.0</string></dict></plist>`
    )
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('iOS version')
    expect(result?.detail).toContain('prebuild')
  })

  test('should warn when Android package is out of sync', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'TestApp',
        slug: 'test',
        android: { package: 'com.newcompany.myapp' }
      }
    }))
    mkdirSync(join(TEST_DIR, 'android', 'app'), { recursive: true })
    writeFileSync(
      join(TEST_DIR, 'android', 'app', 'build.gradle'),
      `applicationId "com.oldcompany.myapp"`
    )
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Android package')
    expect(result?.detail).toContain('prebuild')
  })

  test('should warn when Android versionName is out of sync', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'TestApp', slug: 'test', version: '2.0.0' }
    }))
    mkdirSync(join(TEST_DIR, 'android', 'app'), { recursive: true })
    writeFileSync(
      join(TEST_DIR, 'android', 'app', 'build.gradle'),
      `versionName "1.0.0"`
    )
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Android versionName')
    expect(result?.detail).toContain('prebuild')
  })

  test('should return success when iOS config is in sync', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'TestApp', slug: 'test', version: '2.0.0' }
    }))
    mkdirSync(join(TEST_DIR, 'ios', 'TestApp'), { recursive: true })
    writeFileSync(
      join(TEST_DIR, 'ios', 'TestApp', 'Info.plist'),
      `<plist><dict><key>CFBundleShortVersionString</key><string>2.0.0</string></dict></plist>`
    )
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result?.status).toBe('success')
  })

  test('should return success when Android config is in sync', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'TestApp',
        slug: 'test',
        version: '2.0.0',
        android: { package: 'com.mycompany.myapp' }
      }
    }))
    mkdirSync(join(TEST_DIR, 'android', 'app'), { recursive: true })
    writeFileSync(
      join(TEST_DIR, 'android', 'app', 'build.gradle'),
      `applicationId "com.mycompany.myapp"\nversionName "2.0.0"`
    )
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result?.status).toBe('success')
  })

  test('should return null on parse error', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), '{ invalid }')
    mkdirSync(join(TEST_DIR, 'ios'), { recursive: true })
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result).toBeNull()
  })

  test('should return success when iOS dir exists but Info.plist does not', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'TestApp', slug: 'test', version: '1.0.0' }
    }))
    mkdirSync(join(TEST_DIR, 'ios'), { recursive: true })
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result?.status).toBe('success')
  })

  test('should return success when Android dir exists but build.gradle does not', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'TestApp', slug: 'test', version: '1.0.0' }
    }))
    mkdirSync(join(TEST_DIR, 'android'), { recursive: true })
    const result = await checkConfigFieldsNotSynced.run(ctx())
    expect(result?.status).toBe('success')
  })
})
