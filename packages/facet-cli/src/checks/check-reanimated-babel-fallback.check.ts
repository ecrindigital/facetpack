import type { Check } from './types'

export const checkReanimatedBabelFallback: Check = {
  name: 'reanimated-babel-fallback',
  category: 'Packages',

  async run(ctx) {
    if (!ctx.packageJson) return null

    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    }

    const version = deps['react-native-reanimated']
    if (!version) return null

    const cleanVersion = version.replace(/[\^~]/g, '')

    return {
      label: `react-native-reanimated@${cleanVersion}`,
      status: 'warning',
      detail: 'Babel fallback active',
    }
  },
}
