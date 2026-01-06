import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { metro } from '../metro'
import type { RuleContext } from '../../types'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const TEST_DIR = '/tmp/facet-cli-test-metro'

const mockContext = (cwd: string = TEST_DIR): RuleContext => ({
  cwd,
  packageJson: {},
  fix: false,
})

describe('metro checks', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('metro.config.js existence', () => {
    test('should error when metro.config.js is missing', async () => {
      const results = await metro.checks(mockContext())

      expect(results).toHaveLength(1)
      expect(results[0].status).toBe('error')
      expect(results[0].label).toBe('metro.config.js')
      expect(results[0].detail).toBe('Not found')
    })

    test('should pass when metro.config.js exists', async () => {
      writeFileSync(join(TEST_DIR, 'metro.config.js'), 'module.exports = {}')

      const results = await metro.checks(mockContext())
      const existsCheck = results.find(r => r.label === 'metro.config.js found')

      expect(existsCheck).toBeDefined()
      expect(existsCheck?.status).toBe('success')
    })
  })

  describe('withFacetpack() detection', () => {
    test('should pass when withFacetpack is applied', async () => {
      const config = `
const { withFacetpack } = require('@ecrindigital/facetpack')
module.exports = withFacetpack(config)
`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())
      const withFacetpackCheck = results.find(r => r.label.includes('withFacetpack'))

      expect(withFacetpackCheck).toBeDefined()
      expect(withFacetpackCheck?.status).toBe('success')
      expect(withFacetpackCheck?.label).toBe('withFacetpack() applied')
    })

    test('should error when withFacetpack is imported but not applied', async () => {
      const config = `
const { withFacetpack } = require('@ecrindigital/facetpack')
module.exports = config
`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())
      const withFacetpackCheck = results.find(r => r.label.includes('withFacetpack'))

      expect(withFacetpackCheck).toBeDefined()
      expect(withFacetpackCheck?.status).toBe('error')
      expect(withFacetpackCheck?.detail).toContain('Imported but not applied')
    })

    test('should error when withFacetpack is not present at all', async () => {
      const config = `module.exports = {}`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())
      const withFacetpackCheck = results.find(r => r.label.includes('withFacetpack'))

      expect(withFacetpackCheck).toBeDefined()
      expect(withFacetpackCheck?.status).toBe('error')
      expect(withFacetpackCheck?.detail).toContain('Not found')
    })

    test('should detect withFacetpack with spaces', async () => {
      const config = `module.exports   =   withFacetpack( config )`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())
      const withFacetpackCheck = results.find(r => r.label.includes('withFacetpack'))

      expect(withFacetpackCheck?.status).toBe('success')
    })

    test('should detect exports = withFacetpack pattern', async () => {
      const config = `exports = withFacetpack(config)`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())
      const withFacetpackCheck = results.find(r => r.label.includes('withFacetpack'))

      expect(withFacetpackCheck?.status).toBe('success')
    })
  })

  describe('Transformer and Resolver', () => {
    test('should show transformer and resolver when withFacetpack is applied', async () => {
      const config = `module.exports = withFacetpack(config)`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())

      const transformerCheck = results.find(r => r.label === 'Transformer: facetpack')
      const resolverCheck = results.find(r => r.label === 'Resolver: facetpack')

      expect(transformerCheck).toBeDefined()
      expect(transformerCheck?.status).toBe('success')
      expect(resolverCheck).toBeDefined()
      expect(resolverCheck?.status).toBe('success')
    })

    test('should not show transformer and resolver when withFacetpack is not applied', async () => {
      const config = `module.exports = config`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())

      const transformerCheck = results.find(r => r.label === 'Transformer: facetpack')
      const resolverCheck = results.find(r => r.label === 'Resolver: facetpack')

      expect(transformerCheck).toBeUndefined()
      expect(resolverCheck).toBeUndefined()
    })
  })

  describe('Sentry detection', () => {
    test('should warn when Sentry is detected', async () => {
      const config = `
const { withSentry } = require('@sentry/react-native')
module.exports = withFacetpack(config)
`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())
      const sentryCheck = results.find(r => r.label.includes('Tree-shaking'))

      expect(sentryCheck).toBeDefined()
      expect(sentryCheck?.status).toBe('warning')
      expect(sentryCheck?.detail).toContain('Sentry')
    })

    test('should not warn when Sentry is not present', async () => {
      const config = `module.exports = withFacetpack(config)`
      writeFileSync(join(TEST_DIR, 'metro.config.js'), config)

      const results = await metro.checks(mockContext())
      const sentryCheck = results.find(r => r.label.includes('Tree-shaking'))

      expect(sentryCheck).toBeUndefined()
    })
  })
})
