import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { checkExpoConfigSchema } from '../check-expo-config-schema.check'
import type { CheckContext } from '../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-expo-schema'

const ctx = (): CheckContext => ({
  cwd: TEST_DIR,
  packageJson: null,
  fix: false,
})

describe('check-expo-config-schema', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  test('should have correct metadata', () => {
    expect(checkExpoConfigSchema.name).toBe('expo-config-schema')
    expect(checkExpoConfigSchema.category).toBe('Installation')
  })

  test('should return null when no config file exists', async () => {
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result).toBeNull()
  })

  test('should return error when app.json has invalid JSON', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), '{ invalid json }')
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('error')
    expect(result?.detail).toContain('Invalid JSON')
  })

  test('should return warning when expo key is missing', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({ name: 'test' }))
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Missing "expo" root key')
  })

  test('should return warning when name is missing', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { slug: 'test-app' }
    }))
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('name')
  })

  test('should return warning when slug is missing', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'Test App' }
    }))
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('slug')
  })

  test('should return warning when both name and slug are missing', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { version: '1.0.0' }
    }))
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('name')
    expect(result?.detail).toContain('slug')
  })

  test('should return success when app.json is valid', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: {
        name: 'Test App',
        slug: 'test-app',
      }
    }))
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('valid')
  })

  test('should return success for app.config.ts', async () => {
    writeFileSync(join(TEST_DIR, 'app.config.ts'), 'export default {}')
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('app.config.ts')
    expect(result?.detail).toContain('Dynamic config')
  })

  test('should return success for app.config.js', async () => {
    writeFileSync(join(TEST_DIR, 'app.config.js'), 'module.exports = {}')
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('app.config.js')
    expect(result?.detail).toContain('Dynamic config')
  })

  test('should prefer app.json over dynamic configs when both exist', async () => {
    writeFileSync(join(TEST_DIR, 'app.json'), JSON.stringify({
      expo: { name: 'Test', slug: 'test' }
    }))
    writeFileSync(join(TEST_DIR, 'app.config.ts'), 'export default {}')
    const result = await checkExpoConfigSchema.run(ctx())
    expect(result?.status).toBe('success')
    expect(result?.label).toContain('app.json')
  })
})
