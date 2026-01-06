import type { CategoryCheck, CheckResult } from '../types'

interface PackageCompat {
  name: string
  compatible: string[]
  warning?: string
}

const KNOWN_PACKAGES: PackageCompat[] = [
  { name: 'expo', compatible: ['52', '53', '54'] },
  { name: 'expo-router', compatible: ['3', '4'] },
  { name: 'react-native', compatible: ['0.79', '0.80', '0.81'] },
  { name: 'react-native-reanimated', compatible: ['3'], warning: 'Babel fallback active' },
  { name: 'nativewind', compatible: ['4'] },
  { name: 'tamagui', compatible: ['1'] },
  { name: 'react-native-svg', compatible: ['15'] },
  { name: '@react-navigation/native', compatible: ['6', '7'] },
]

export const packages: CategoryCheck = {
  name: 'Detected Packages',
  icon: '📚',

  async checks(ctx) {
    const results: CheckResult[] = []

    if (!ctx.packageJson) {
      return results
    }

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    for (const pkg of KNOWN_PACKAGES) {
      const version = deps[pkg.name]
      if (!version) continue

      const cleanVersion = version.replace(/[\^~]/g, '')
      const major = pkg.name === 'react-native'
        ? cleanVersion.split('.').slice(0, 2).join('.')
        : cleanVersion.split('.')[0] ?? '0'

      const isCompatible = pkg.compatible.includes(major)

      if (isCompatible && pkg.warning) {
        results.push({
          label: `${pkg.name}@${cleanVersion}`,
          status: 'warning',
          detail: pkg.warning,
        })
      } else if (isCompatible) {
        results.push({
          label: `${pkg.name}@${cleanVersion}`,
          status: 'success',
          detail: 'Compatible',
        })
      } else {
        results.push({
          label: `${pkg.name}@${cleanVersion}`,
          status: 'warning',
          detail: `May not be compatible (expected: ${pkg.compatible.join(', ')})`,
        })
      }
    }

    return results
  },
}
