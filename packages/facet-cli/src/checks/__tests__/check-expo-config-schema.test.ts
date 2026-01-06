import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import { checkExpoConfigSchema } from '../check-expo-config-schema.check'
import type { CheckContext } from '../types'
import * as fs from 'node:fs'

const mockExistsSync = mock(() => false)
const mockReadFileSync = mock(() => '')

mock.module('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}))

describe('check-expo-config-schema', () => {
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
    expect(checkExpoConfigSchema.name).toBe('expo-config-schema')
    expect(checkExpoConfigSchema.category).toBe('Installation')
  })

  test('should return null when no config file exists', async () => {
    mockExistsSync.mockImplementation(() => false)

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result).toBeNull()
  })

  test('should return error when app.json has invalid JSON', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => '{ invalid json }')

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('error')
    expect(result?.detail).toContain('Invalid JSON')
  })

  test('should return warning when expo key is missing', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({ name: 'test' }))

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Missing "expo" root key')
  })

  test('should return warning when name is missing', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: { slug: 'test-app' }
    }))

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('name')
  })

  test('should return warning when slug is missing', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: { name: 'Test App' }
    }))

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('slug')
  })

  test('should return warning when both name and slug are missing', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: { version: '1.0.0' }
    }))

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('name')
    expect(result?.detail).toContain('slug')
  })

  test('should return success when app.json is valid', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.json'))
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: {
        name: 'Test App',
        slug: 'test-app',
      }
    }))

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('valid')
  })

  test('should return success for app.config.ts', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.config.ts'))

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('app.config.ts')
    expect(result?.detail).toContain('Dynamic config')
  })

  test('should return success for app.config.js', async () => {
    mockExistsSync.mockImplementation((path: string) => path.includes('app.config.js'))

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('app.config.js')
    expect(result?.detail).toContain('Dynamic config')
  })

  test('should prefer app.json over dynamic configs when both exist', async () => {
    mockExistsSync.mockImplementation(() => true)
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      expo: { name: 'Test', slug: 'test' }
    }))

    const result = await checkExpoConfigSchema.run(baseContext)
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('app.json')
  })
})
