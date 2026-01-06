import { defineCommand } from 'citty'
import pc from 'picocolors'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { categories, type RuleContext, type CheckResult } from '../rules'

const VERSION = '0.1.0'

const icons = {
  success: pc.green('✓'),
  warning: pc.yellow('⚠'),
  error: pc.red('✗'),
  info: pc.blue('ℹ'),
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function clearLine() {
  process.stdout.write('\r\x1b[K')
}

async function spinner(text: string, duration: number) {
  const frames = icons.spinner
  let i = 0
  const interval = setInterval(() => {
    clearLine()
    process.stdout.write(`│  ${pc.cyan(frames[i % frames.length])} ${pc.dim(text)}`)
    i++
  }, 80)

  await sleep(duration)
  clearInterval(interval)
  clearLine()
}

function printCheck(result: CheckResult) {
  const icon = icons[result.status]
  const detail = result.detail ? pc.dim(` — ${result.detail}`) : ''
  console.log(`│  ${icon} ${result.label}${detail}`)
}

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
    verbose: {
      type: 'boolean',
      description: 'Show all checks',
      alias: 'v',
      default: false,
    },
  },
  async run({ args }) {
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

    console.log()
    console.log(`${pc.cyan('◆')}  ${pc.bold('Facetpack Doctor')} ${pc.dim(`v${VERSION}`)}`)
    console.log(pc.dim('│'))

    let totalWarnings = 0
    let totalErrors = 0

    for (const category of categories) {
      console.log(`${pc.dim('├─')} ${category.icon} ${pc.bold(category.name)}`)

      await spinner(`Checking ${category.name.toLowerCase()}...`, 100 + Math.random() * 150)

      const results = await category.checks(ctx)

      for (const result of results) {
        if (result.status === 'warning') totalWarnings++
        if (result.status === 'error') totalErrors++
        printCheck(result)
      }

      if (results.length === 0) {
        console.log(`│  ${pc.dim('No checks')}`)
      }

      console.log(pc.dim('│'))
    }

    if (totalWarnings > 0 || totalErrors > 0) {
      console.log(`${pc.dim('├─')} 📋 ${pc.bold('Issues')}`)
      if (totalErrors > 0) {
        console.log(`│  ${icons.error} ${pc.red(`${totalErrors} error${totalErrors > 1 ? 's' : ''}`)} ${pc.dim('(blocking)')}`)
      }
      if (totalWarnings > 0) {
        console.log(`│  ${icons.warning} ${pc.yellow(`${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}`)} ${pc.dim('(non-blocking)')}`)
      }
      console.log(pc.dim('│'))
    }

    const statusText = totalErrors > 0
      ? pc.red('Fix errors before continuing')
      : totalWarnings > 0
        ? pc.yellow('Ready with warnings')
        : pc.green('Ready to use')

    const statusEmoji = totalErrors > 0 ? '🔴' : totalWarnings > 0 ? '🟡' : '⚡'

    console.log(`${pc.dim('└─')} Status: ${statusText} ${statusEmoji}`)
    console.log()

    if (totalErrors > 0) {
      process.exit(1)
    }
  },
})
