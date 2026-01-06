import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { checkWithFacetpackApplied } from '../check-with-facetpack-applied.check'
import type { CheckContext } from '../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-with-facetpack'

describe('check-with-facetpack-applied', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  const ctx = (): CheckContext => ({ cwd: TEST_DIR, packageJson: {}, fix: false })

  test('should return null when metro.config.js is missing', async () => {
    const result = await checkWithFacetpackApplied.run(ctx())
    expect(result).toBeNull()
  })

  test('should pass when withFacetpack is applied', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = withFacetpack(config)')
    const result = await checkWithFacetpackApplied.run(ctx())

    expect(result?.status).toBe('success')
    expect(result?.label).toBe('withFacetpack() applied')
  })

  test('should error when withFacetpack is imported but not applied', async () => {
    const content = `
const { withFacetpack } = require('@ecrindigital/facetpack')
module.exports = config
`
    writeFileSync(join(TEST_DIR, 'metro.config.js'), content)
    const result = await checkWithFacetpackApplied.run(ctx())

    expect(result?.status).toBe('error')
    expect(result?.detail).toContain('Imported but not applied')
  })

  test('should error when withFacetpack is not present', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = {}')
    const result = await checkWithFacetpackApplied.run(ctx())

    expect(result?.status).toBe('error')
    expect(result?.detail).toContain('Not found')
  })

  test('should detect withFacetpack with spaces', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports   =   withFacetpack( config )')
    const result = await checkWithFacetpackApplied.run(ctx())

    expect(result?.status).toBe('success')
  })

  test('should detect exports = withFacetpack pattern', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'exports = withFacetpack(config)')
    const result = await checkWithFacetpackApplied.run(ctx())

    expect(result?.status).toBe('success')
  })

  test('should have correct category', () => {
    expect(checkWithFacetpackApplied.category).toBe('Metro')
  })
})
