import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

const RECOMMENDED_PATTERNS = [
  'node_modules',
  '.expo',
  'dist',
  '*.log',
  '.env',
  '.env.local',
]

const CRITICAL_PATTERNS = [
  'node_modules',
  '.env',
]

const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  'credentials.json',
  'google-services.json',
  'GoogleService-Info.plist',
]

export const checkGitignore: Check = {
  name: 'gitignore',
  category: 'Installation',

  async run(ctx) {
    const gitignorePath = join(ctx.cwd, '.gitignore')
    const gitDir = join(ctx.cwd, '.git')

    if (!existsSync(gitDir)) {
      return {
        label: '.gitignore',
        status: 'info',
        detail: 'Not a git repository',
      }
    }

    if (!existsSync(gitignorePath)) {
      return {
        label: '.gitignore',
        status: 'warning',
        detail: 'File not found — create one',
      }
    }

    try {
      const content = readFileSync(gitignorePath, 'utf-8')
      const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))

      const missingCritical: string[] = []
      const missingSensitive: string[] = []

      for (const pattern of CRITICAL_PATTERNS) {
        const found = lines.some(line =>
          line === pattern ||
          line.includes(pattern) ||
          (pattern === 'node_modules' && line.includes('node_modules'))
        )
        if (!found) {
          missingCritical.push(pattern)
        }
      }

      for (const file of SENSITIVE_FILES) {
        if (existsSync(join(ctx.cwd, file))) {
          const isIgnored = lines.some(line =>
            line === file ||
            line.includes(file) ||
            (file.startsWith('.env') && line.includes('.env'))
          )
          if (!isIgnored) {
            missingSensitive.push(file)
          }
        }
      }

      if (missingSensitive.length > 0) {
        return {
          label: '.gitignore',
          status: 'error',
          detail: `Sensitive file not ignored: ${missingSensitive[0]}`,
        }
      }

      if (missingCritical.length > 0) {
        return {
          label: '.gitignore',
          status: 'warning',
          detail: `Missing: ${missingCritical.join(', ')}`,
        }
      }

      const coveredCount = RECOMMENDED_PATTERNS.filter(pattern =>
        lines.some(line => line.includes(pattern))
      ).length

      return {
        label: '.gitignore',
        status: 'success',
        detail: `${coveredCount}/${RECOMMENDED_PATTERNS.length} recommended patterns`,
      }
    } catch {
      return null
    }
  },
}
