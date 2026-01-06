import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { checkMetroConfigExists } from '../check-metro-config-exists.check'
import type { CheckContext } from '../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-metro-exists'

describe('check-metro-config-exists', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  test('should error when metro.config.js is missing', async () => {
    const ctx: CheckContext = { cwd: TEST_DIR, packageJson: {}, fix: false }
    const result = await checkMetroConfigExists.run(ctx)

    expect(result?.status).toBe('error')
    expect(result?.detail).toBe('Not found')
  })

  test('should pass when metro.config.js exists', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = {}')
    const ctx: CheckContext = { cwd: TEST_DIR, packageJson: {}, fix: false }
    const result = await checkMetroConfigExists.run(ctx)

    expect(result?.status).toBe('success')
    expect(result?.label).toBe('metro.config.js found')
  })

  test('should have correct category', () => {
    expect(checkMetroConfigExists.category).toBe('Metro')
  })
})
