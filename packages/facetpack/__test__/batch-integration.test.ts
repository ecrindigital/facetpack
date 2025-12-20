import { test, expect, beforeEach } from 'bun:test'
import { transform, clearCache, getCacheStats } from '../src'

const TEST_CODE = `
import React from 'react'
import { View, Text } from 'react-native'
import { useCallback } from 'react'

export default function App() {
  return (
    <View>
      <Text>Hello</Text>
    </View>
  )
}
`

beforeEach(() => {
  clearCache()
})

test('transform should pre-resolve imports in batch', () => {
  const result = transform({
    filename: '/test/App.tsx',
    src: TEST_CODE,
    options: { dev: false, hot: false, platform: 'ios' },
  })

  expect(result.code).toBeDefined()

  const stats = getCacheStats()
  expect(stats.files).toBe(1)
  expect(stats.resolutions).toBeGreaterThan(0)
})

test('extractSpecifiers should find all imports', () => {
  const result = transform({
    filename: '/test/App.tsx',
    src: TEST_CODE,
    options: { dev: false, hot: false, platform: 'ios' },
  })

  const stats = getCacheStats()
  expect(stats.resolutions).toBe(3)
})

test('cache should work across multiple transforms', () => {
  transform({
    filename: '/test/App1.tsx',
    src: TEST_CODE,
    options: { dev: false, hot: false, platform: 'ios' },
  })

  transform({
    filename: '/test/App2.tsx',
    src: `import { useState } from 'react'\nexport const x = useState(0)`,
    options: { dev: false, hot: false, platform: 'ios' },
  })

  const stats = getCacheStats()
  expect(stats.files).toBe(2)
})
