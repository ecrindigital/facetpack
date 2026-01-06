import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { checkExpoConfigCommonIssues } from '../check-expo-config-common-issues.check'
import type { CheckContext } from '../types'
import * as fs from 'node:fs'

const mockExistsSync = mock(() => false)
const mockReadFileSync = mock(() => '')

mock.module('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}))

describe('check-expo-config-common-issues', () => {
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
    expect(checkExpoConfigCommonIssues.name).toBe('expo-config-common-issues')
    expect(checkExpoConfigCommonIssues.category).toBe('Installation')
  })

  test('should return null when app.json does not exist', async () => {
    mockExistsSync.mockImplementation(() => false)

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result).toBeNull()
  })

  test('should return null when expo key is missing', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({ name: 'test' }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result).toBeNull()
  })

  test('should warn on invalid iOS bundleIdentifier format', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        ios: { bundleIdentifier: 'invalid' }
      }
    }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Invalid iOS bundleIdentifier')
  })

  test('should warn on com.example placeholder in iOS bundleIdentifier', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        ios: { bundleIdentifier: 'com.example.myapp' }
      }
    }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('placeholder')
  })

  test('should warn on invalid Android package format', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        android: { package: '123invalid' }
      }
    }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Invalid Android package')
  })

  test('should warn on com.example placeholder in Android package', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        android: { package: 'com.example.myapp' }
      }
    }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('placeholder')
  })

  test('should warn when icon file does not exist', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path.includes('icon.png')) return false
      return false
    })
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        icon: './assets/icon.png'
      }
    }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Icon not found')
  })

  test('should warn when splash image does not exist', async () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path.includes('app.json')) return true
      if (path.includes('splash.png')) return false
      return false
    })
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        splash: { image: './assets/splash.png' }
      }
    }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Splash image not found')
  })

  test('should warn on default version/buildNumber', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        version: '1.0.0',
        ios: { buildNumber: '1' }
      }
    }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('default version')
  })

  test('should show count of additional issues', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test',
        slug: 'test',
        ios: { bundleIdentifier: 'com.example.test' },
        android: { package: 'com.example.test' }
      }
    }))

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('+')
  })

  test('should return success when no issues found', async () => {
    mockExistsSync.mockImplementation(() => true)
    mockReadFileSync.mockImplementation(() => JSON.stringify({
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

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result?.status).toBe('success')
    expect(result?.detail).toContain('No common issues')
  })

  test('should return null on parse error', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => '{ invalid }')

    const result = await checkExpoConfigCommonIssues.run(baseContext)
    expect(result).toBeNull()
  })
})
