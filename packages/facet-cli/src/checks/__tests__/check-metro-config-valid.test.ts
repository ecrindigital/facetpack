import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { checkMetroConfigValid } from '../check-metro-config-valid.check'
import type { CheckContext } from '../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-metro-valid'

describe('check-metro-config-valid', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  const ctx = (): CheckContext => ({ cwd: TEST_DIR, packageJson: {}, fix: false })

  test('should return null when metro.config.js is missing', async () => {
    const result = await checkMetroConfigValid.run(ctx())
    expect(result).toBeNull()
  })

  test('should pass for valid config', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = {}')
    const result = await checkMetroConfigValid.run(ctx())

    expect(result?.status).toBe('success')
    expect(result?.label).toBe('metro.config.js valid')
  })

  test('should error for invalid syntax', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = {{{')
    const result = await checkMetroConfigValid.run(ctx())

    expect(result?.status).toBe('error')
    expect(result?.detail).toContain('Invalid JavaScript syntax')
  })

  test('should warn for eval usage', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'eval("code")')
    const result = await checkMetroConfigValid.run(ctx())

    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('eval')
  })

  test('should have correct category', () => {
    expect(checkMetroConfigValid.category).toBe('Metro')
  })
})
