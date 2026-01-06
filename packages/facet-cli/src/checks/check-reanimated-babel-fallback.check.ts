import type { Check } from './types'

/**
 * Detects whether React Native Reanimated is running with Babel fallback.
 *
 * @remarks
 * This check verifies if `react-native-reanimated` is present in the
 * project's dependencies. If found, it reports a warning indicating
 * that the Babel fallback is active.
 *
 * Babel fallback mode is usually enabled when the Reanimated
 * native plugin is not properly configured or cannot be loaded.
 *
 * @why
 * Running Reanimated in Babel fallback mode can lead to reduced
 * performance and missing optimizations compared to the native setup.
 *
 * @category Packages
 */
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
