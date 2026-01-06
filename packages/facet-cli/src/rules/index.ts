import type { Rule, RuleContext, RuleDiagnostic } from './types'
import { nodeVersion } from './node-version'
import { reactNativeVersion } from './react-native-version'
import { metroConfig } from './metro-config'
import { facetpackInstalled } from './facetpack-installed'
import { expoSdk } from './expo-sdk'

export type { Rule, RuleContext, RuleDiagnostic }
export { nodeVersion, reactNativeVersion, metroConfig, facetpackInstalled, expoSdk }

export const rules: Rule[] = [
  nodeVersion,
  reactNativeVersion,
  metroConfig,
  facetpackInstalled,
  expoSdk,
]

export interface RunResult {
  rule: Rule
  diagnostic: RuleDiagnostic | null
}

export async function runRules(ctx: RuleContext): Promise<RunResult[]> {
  const results: RunResult[] = []

  for (const rule of rules) {
    const diagnostic = await rule.run(ctx)
    results.push({ rule, diagnostic })
  }

  return results
}
