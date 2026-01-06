export type CheckStatus = 'success' | 'warning' | 'error' | 'info'

export type CheckCategory = 'Environment' | 'Installation' | 'Metro' | 'Packages' | 'Runtime'

export interface CheckContext {
  cwd: string
  packageJson: Record<string, unknown> | null
  fix: boolean
}

export interface CheckResult {
  label: string
  status: CheckStatus
  detail?: string
}

export interface Check {
  name: string
  category: CheckCategory
  run: (ctx: CheckContext) => Promise<CheckResult | null>
}
