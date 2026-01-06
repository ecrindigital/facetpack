import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { environment } from '../environment'
import type { RuleContext } from '../../types'

const mockContext: RuleContext = {
  cwd: '/test/project',
  packageJson: null,
  fix: false,
}

describe('environment checks', () => {
  describe('Node.js version', () => {
    test('should pass for Node.js >= 18', async () => {
      const results = await environment.checks(mockContext)
      const nodeCheck = results.find(r => r.label.includes('Node.js'))

      expect(nodeCheck).toBeDefined()
      expect(nodeCheck?.status).toBe('success')
      expect(nodeCheck?.detail).toBe('>= 18 required')
    })

    test('should include version number in label', async () => {
      const results = await environment.checks(mockContext)
      const nodeCheck = results.find(r => r.label.includes('Node.js'))

      expect(nodeCheck?.label).toMatch(/Node\.js \d+\.\d+\.\d+/)
    })
  })

  describe('Platform', () => {
    test('should detect current platform', async () => {
      const results = await environment.checks(mockContext)
      const platformCheck = results.find(r => r.label.includes('Platform'))

      expect(platformCheck).toBeDefined()
      expect(platformCheck?.status).toBe('success')
      expect(platformCheck?.label).toContain(process.platform)
      expect(platformCheck?.label).toContain(process.arch)
    })
  })

  describe('Bun', () => {
    test('should detect bun installation', async () => {
      const results = await environment.checks(mockContext)
      const bunCheck = results.find(r => r.label.includes('bun'))

      expect(bunCheck).toBeDefined()
    })
  })

  describe('Watchman', () => {
    test('should check for watchman', async () => {
      const results = await environment.checks(mockContext)
      const watchmanCheck = results.find(r => r.label.includes('Watchman') || r.label.includes('watchman'))

      expect(watchmanCheck).toBeDefined()
      expect(['success', 'warning']).toContain(watchmanCheck?.status)
    })
  })

  test('should return all expected checks', async () => {
    const results = await environment.checks(mockContext)

    expect(results.length).toBeGreaterThanOrEqual(3)
  })
})
