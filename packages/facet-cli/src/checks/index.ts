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
import { checkExpoConfigSchema } from './check-expo-config-schema.check'
import { checkExpoConfigCommonIssues } from './check-expo-config-common-issues.check'
import { checkConfigFieldsNotSynced } from './check-config-fields-not-synced.check'
import { checkProjectSetup } from './check-project-setup.check'
import { checkPackageJson } from './check-package-json.check'
import { checkStoreCompatibility } from './check-store-compatibility.check'
import { checkGitignore } from './check-gitignore.check'
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
  checkProjectSetup,
  checkPackageJson,
  checkExpoConfigSchema,
  checkExpoConfigCommonIssues,
  checkConfigFieldsNotSynced,
  checkStoreCompatibility,
  checkGitignore,
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

export const categoryIcons: Record<CheckCategory, string> = {
  Environment: '🖥',
  Installation: '📦',
  Metro: '🚇',
  Packages: '📚',
  Runtime: '⚡',
}

export const categoryOrder: CheckCategory[] = [
  'Environment',
  'Installation',
  'Metro',
  'Packages',
  'Runtime',
]

export function getChecksByCategory(): Map<CheckCategory, Check[]> {
  const map = new Map<CheckCategory, Check[]>()

  for (const category of categoryOrder) {
    map.set(category, checks.filter(c => c.category === category))
  }

  return map
}
