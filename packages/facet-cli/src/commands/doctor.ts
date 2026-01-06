import { defineCommand } from 'citty'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runRules, type RuleContext } from '../rules'

export const doctor = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Diagnose and fix common issues',
  },
  args: {
    fix: {
      type: 'boolean',
      description: 'Auto-fix issues',
      default: false,
    },
  },
  async run({ args }) {
    p.intro(pc.cyan('Facet Doctor'))

    const cwd = process.cwd()
    const packageJsonPath = join(cwd, 'package.json')

    let packageJson: Record<string, unknown> | null = null
    if (existsSync(packageJsonPath)) {
      packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    }

    const ctx: RuleContext = {
      cwd,
      packageJson,
      fix: args.fix,
    }

    const spinner = p.spinner()
    spinner.start('Running diagnostics...')

    const results = await runRules(ctx)

    spinner.stop('Diagnostics complete')

    const issues = results.filter(r => r.diagnostic !== null)
    const errors = issues.filter(r => r.diagnostic?.severity === 'error')
    const warnings = issues.filter(r => r.diagnostic?.severity === 'warning')
    const infos = issues.filter(r => r.diagnostic?.severity === 'info')

    if (issues.length === 0) {
      p.note(pc.green('All checks passed!'), 'Result')
    } else {
      console.log()

      for (const { rule, diagnostic } of issues) {
        if (!diagnostic) continue

        const icon = diagnostic.severity === 'error' ? pc.red('✗')
          : diagnostic.severity === 'warning' ? pc.yellow('!')
          : pc.blue('i')

        const color = diagnostic.severity === 'error' ? pc.red
          : diagnostic.severity === 'warning' ? pc.yellow
          : pc.blue

        console.log(`${icon} ${pc.dim(`[${rule.name}]`)} ${color(diagnostic.message)}`)

        if (diagnostic.fix && args.fix) {
          const fixed = await diagnostic.fix()
          if (fixed) {
            console.log(`  ${pc.green('→ Fixed')}`)
          }
        }
      }

      console.log()

      const summary: string[] = []
      if (errors.length > 0) summary.push(pc.red(`${errors.length} error(s)`))
      if (warnings.length > 0) summary.push(pc.yellow(`${warnings.length} warning(s)`))
      if (infos.length > 0) summary.push(pc.blue(`${infos.length} info(s)`))

      p.note(summary.join(', '), 'Summary')
    }

    p.outro(
      issues.length === 0
        ? pc.green('Your project looks healthy!')
        : errors.length > 0
          ? pc.red('Fix errors before continuing')
          : pc.yellow('Some warnings to review')
    )

    if (errors.length > 0) {
      process.exit(1)
    }
  },
})
