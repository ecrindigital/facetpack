import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { checkConfigFieldsNotSynced } from '../check-config-fields-not-synced.check'
import type { CheckContext } from '../types'
import * as fs from 'node:fs'

const mockExistsSync = mock(() => false)
const mockReadFileSync = mock(() => '')

mock.module('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}))

describe('check-config-fields-not-synced', () => {
  const baseContext: CheckContext = {
    cwd: '/test/project',
    packageJson: null,
    fix: false,
  }

  beforeEach(() => {
    mockExistsSync.mockReset()
    mockReadFileSync.mockReset()
  })

  test('should have correct metadata', () => {
    expect(checkConfigFieldsNotSynced.name).toBe('config-fields-not-synced')
    expect(checkConfigFieldsNotSynced.category).toBe('Installation')
  })

  test('should return null when app.json does not exist', async () => {
    mockExistsSync.mockImplementation(() => false)

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result).toBeNull()
  })

  test('should return null when no ios or android directories exist', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: { name: 'Test', slug: 'test' }
    }))

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result).toBeNull()
  })

  test('should return null when expo key is missing', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path.includes('ios')) return true
      return false
    })
    mockReadFileSync.mockImplementation(() => JSON.stringify({ name: 'test' }))

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result).toBeNull()
  })

  test('should warn when iOS version is out of sync', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path === '/test/project/ios') return true
      if (path.includes('Info.plist')) return true
      return false
    })
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) {
        return JSON.stringify({
          expo: { name: 'TestApp', slug: 'test', version: '2.0.0' }
        })
      }
      if (path.includes('Info.plist')) {
        return `<plist><dict><key>CFBundleShortVersionString</key><string>1.0.0</string></dict></plist>`
      }
      return ''
    })

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('iOS version')
    expect(result?.detail).toContain('prebuild')
  })

  test('should warn when Android package is out of sync', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path === '/test/project/android') return true
      if (path.includes('build.gradle')) return true
      return false
    })
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) {
        return JSON.stringify({
          expo: {
            name: 'TestApp',
            slug: 'test',
            android: { package: 'com.newcompany.myapp' }
          }
        })
      }
      if (path.includes('build.gradle')) {
        return `applicationId "com.oldcompany.myapp"`
      }
      return ''
    })

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Android package')
    expect(result?.detail).toContain('prebuild')
  })

  test('should warn when Android versionName is out of sync', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path === '/test/project/android') return true
      if (path.includes('build.gradle')) return true
      return false
    })
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) {
        return JSON.stringify({
          expo: { name: 'TestApp', slug: 'test', version: '2.0.0' }
        })
      }
      if (path.includes('build.gradle')) {
        return `versionName "1.0.0"`
      }
      return ''
    })

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Android versionName')
    expect(result?.detail).toContain('prebuild')
  })

  test('should return success when config is in sync', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path === '/test/project/ios') return true
      if (path === '/test/project/android') return true
      if (path.includes('Info.plist')) return true
      if (path.includes('build.gradle')) return true
      return false
    })
    mockReadFileSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) {
        return JSON.stringify({
          expo: {
            name: 'TestApp',
            slug: 'test',
            version: '2.0.0',
            android: { package: 'com.mycompany.myapp' }
          }
        })
      }
      if (path.includes('Info.plist')) {
        return `<plist><dict><key>CFBundleShortVersionString</key><string>2.0.0</string></dict></plist>`
      }
      if (path.includes('build.gradle')) {
        return `applicationId "com.mycompany.myapp"\nversionName "2.0.0"`
      }
      return ''
    })

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('Native config sync')
  })

  test('should return null on parse error', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path === '/test/project/ios') return true
      return false
    })
    mockReadFileSync.mockImplementation(() => '{ invalid }')

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result).toBeNull()
  })

  test('should check iOS without Info.plist when file does not exist', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path === '/test/project/ios') return true
      if (path.includes('Info.plist')) return false
      return false
    })
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: { name: 'TestApp', slug: 'test', version: '1.0.0' }
    }))

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result?.status).toBe('success')
  })

  test('should check Android without build.gradle when file does not exist', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path === '/test/project/android') return true
      if (path.includes('build.gradle')) return false
      return false
    })
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: { name: 'TestApp', slug: 'test', version: '1.0.0' }
    }))

    const result = await checkConfigFieldsNotSynced.run(baseContext)
    expect(result?.status).toBe('success')
  })
})
