import type { Check, CheckContext, CheckResult, CheckCategory } from './types'

import { checkNodeVersion } from './check-node-version.check'
import { checkBunInstalled } from './check-bun-installed.check'
import { checkPackageManagerVersion } from './check-package-manager-version.check'
import { checkPlatform } from './check-platform.check'
import { checkWatchmanInstalled } from './check-watchman-installed.check'
import { checkXcodeVersion } from './check-xcode-version.check'
import { checkCocoapodsVersion } from './check-cocoapods-version.check'
import { checkAndroidSdk } from './check-android-sdk.check'
import { checkFacetpackInstalled } from './check-facetpack-installed.check'
import { checkFacetpackNativeInstalled } from './check-facetpack-native-installed.check'
import { checkNativeBindingsLoaded } from './check-native-bindings-loaded.check'
import { checkMetroConfigExists } from './check-metro-config-exists.check'
import { checkMetroConfigValid } from './check-metro-config-valid.check'
import { checkWithFacetpackApplied } from './check-with-facetpack-applied.check'
import { checkTransformerConfigured } from './check-transformer-configured.check'
import { checkResolverConfigured } from './check-resolver-configured.check'
import { checkSerializerConflict } from './check-serializer-conflict.check'
import { checkWrapperOrder } from './check-wrapper-order.check'
import { checkReactNativeVersion } from './check-react-native-version.check'
import { checkExpoVersion } from './check-expo-version.check'
import { checkReanimatedBabelFallback } from './check-reanimated-babel-fallback.check'
import { checkRuntimeTransform } from './check-runtime-transform.check'
import { checkRuntimeMinify } from './check-runtime-minify.check'
import { checkRuntimeResolve } from './check-runtime-resolve.check'

export type { Check, CheckContext, CheckResult, CheckCategory }

/**
 * Ordered list of all available doctor checks.
 *
 * @remarks
 * The order of checks here determines:
 * - Execution order in `facet doctor`
 * - Grouping behavior when rendering results by category
 *
 * Each check implements the {@link Check} interface and may return:
 * - a successful result
 * - a warning or error
 * - or `null` if the check is not applicable in the current environment
 */
export const checks: Check[] = [
  checkNodeVersion,
  checkBunInstalled,
  checkPackageManagerVersion,
  checkPlatform,
  checkWatchmanInstalled,
  checkXcodeVersion,
  checkCocoapodsVersion,
  checkAndroidSdk,
  checkFacetpackInstalled,
  checkFacetpackNativeInstalled,
  checkNativeBindingsLoaded,
  checkMetroConfigExists,
  checkMetroConfigValid,
  checkWithFacetpackApplied,
  checkTransformerConfigured,
  checkResolverConfigured,
  checkSerializerConflict,
  checkWrapperOrder,
  checkReactNativeVersion,
  checkExpoVersion,
  checkReanimatedBabelFallback,
  checkRuntimeTransform,
  checkRuntimeMinify,
  checkRuntimeResolve,
]

/**
 * Icon mapping for each check category.
 *
 * @remarks
 * Used by the CLI renderer to visually distinguish
 * different groups of checks in `facet doctor` output.
 */
export const categoryIcons: Record<CheckCategory, string> = {
  Environment: '🖥',
  Installation: '📦',
  Metro: '🚇',
  Packages: '📚',
  Runtime: '⚡',
}

/**
 * Defines the display and execution order of check categories.
 *
 * @remarks
 * Categories not listed here will not be rendered by default.
 */
export const categoryOrder: CheckCategory[] = [
  'Environment',
  'Installation',
  'Metro',
  'Packages',
  'Runtime',
]

/**
 * Groups all registered checks by their category.
 *
 * @returns A map where each key is a {@link CheckCategory}
 * and the value is an ordered list of checks belonging to that category.
 *
 * @remarks
 * This is used internally by the doctor command
 * to render grouped output in a consistent order.
 */
export function getChecksByCategory(): Map<CheckCategory, Check[]> {
  const map = new Map<CheckCategory, Check[]>()

  for (const category of categoryOrder) {
    map.set(category, checks.filter(c => c.category === category))
  }

  return map
}
