export type RuleSeverity = 'success' | 'warning' | 'error' | 'info'

export interface RuleContext {
  cwd: string
  packageJson: Record<string, unknown> | null
  fix: boolean
}

export interface CheckResult {
  label: string
  status: RuleSeverity
  detail?: string
}

export interface CategoryCheck {
  name: string
  icon: string
  checks: (ctx: RuleContext) => Promise<CheckResult[]>
}
