export type RuleSeverity = 'error' | 'warning' | 'info'

export interface RuleContext {
  cwd: string
  packageJson: Record<string, unknown> | null
  fix: boolean
}

export interface RuleDiagnostic {
  message: string
  severity: RuleSeverity
  fix?: () => Promise<boolean>
}

export interface Rule {
  name: string
  description: string
  run: (ctx: RuleContext) => Promise<RuleDiagnostic | null>
}
