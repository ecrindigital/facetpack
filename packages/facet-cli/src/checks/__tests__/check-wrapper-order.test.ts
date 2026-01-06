import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { checkWrapperOrder } from '../check-wrapper-order.check'
import type { CheckContext } from '../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-wrapper-order'

describe('check-wrapper-order', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  const ctx = (): CheckContext => ({ cwd: TEST_DIR, packageJson: {}, fix: false })

  test('should return null when metro.config.js is missing', async () => {
    const result = await checkWrapperOrder.run(ctx())
    expect(result).toBeNull()
  })

  test('should return null when withFacetpack is not used', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = config')
    const result = await checkWrapperOrder.run(ctx())

    expect(result).toBeNull()
  })

  test('should pass when withFacetpack is innermost', async () => {
    const config = `module.exports = withSentry(withFacetpack(config))`
    writeFileSync(join(TEST_DIR, 'metro.config.js'), config)
    const result = await checkWrapperOrder.run(ctx())

    expect(result?.status).toBe('success')
    expect(result?.detail).toBe('withFacetpack is innermost')
  })

  test('should pass when only withFacetpack is used', async () => {
    writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = withFacetpack(config)')
    const result = await checkWrapperOrder.run(ctx())

    expect(result?.status).toBe('success')
  })

  test('should have correct category', () => {
    expect(checkWrapperOrder.category).toBe('Metro')
  })
})
