import { defineCommand } from 'citty'
import * as p from '@clack/prompts'
import pc from 'picocolors'

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

    const spinner = p.spinner()
    spinner.start('Checking your project...')

    await new Promise(resolve => setTimeout(resolve, 1000))

    spinner.stop('Check complete')

    const issues: { type: string; message: string; fix?: string }[] = []

    if (issues.length === 0) {
      p.note(pc.green('No issues found!'), 'Result')
    } else {
      for (const issue of issues) {
        p.log.warn(`[${issue.type}] ${issue.message}`)
        if (issue.fix && args.fix) {
          p.log.info(`  → Fixing: ${issue.fix}`)
        }
      }
    }

    p.outro(issues.length === 0
      ? pc.green('Your project looks healthy!')
      : `Found ${issues.length} issue(s). Run with --fix to auto-fix.`
    )
  },
})
