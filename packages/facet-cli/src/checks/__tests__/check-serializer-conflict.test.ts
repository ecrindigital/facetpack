import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { checkSerializerConflict } from '../check-serializer-conflict.check'
import type { CheckContext } from '../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-serializer'

describe('check-serializer-conflict', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  const ctx = (): CheckContext => ({ cwd: TEST_DIR, packageJson: {}, fix: false })

  test('should return null when metro.config.js is missing', async () => {
    const result = await checkSerializerConflict.run(ctx())
    expect(result).toBeNull()
  })

  test('should return null when no conflict detected', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = withFacetpack(config)')
    const result = await checkSerializerConflict.run(ctx())

    expect(result).toBeNull()
  })

  test('should warn when Sentry is detected', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'const { withSentry } = require("@sentry/react-native")')
    const result = await checkSerializerConflict.run(ctx())

    expect(result?.status).toBe('warning')
    expect(result?.detail).toContain('Sentry')
  })

  test('should warn when serializer override is detected', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'config.serializer : { customSerializer: true }')
    const result = await checkSerializerConflict.run(ctx())

    expect(result?.status).toBe('warning')
  })

  test('should have correct category', () => {
    expect(checkSerializerConflict.category).toBe('Metro')
  })
})
