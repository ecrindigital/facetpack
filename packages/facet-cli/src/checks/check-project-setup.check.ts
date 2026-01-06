import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Check } from './types'

const REQUIRED_DIRS = ['src', 'node_modules']
const COMMON_DIRS = ['assets', 'app', 'components']
const REQUIRED_FILES = ['package.json']
const COMMON_FILES = ['tsconfig.json', 'babel.config.js', 'metro.config.js', 'app.json']

export const checkProjectSetup: Check = {
  name: 'project-setup',
  category: 'Installation',

  async run(ctx) {
    const missingRequired: string[] = []
    const existingOptional: string[] = []

    for (const dir of REQUIRED_DIRS) {
      if (!existsSync(join(ctx.cwd, dir))) {
        missingRequired.push(dir)
      }
    }

    for (const file of REQUIRED_FILES) {
      if (!existsSync(join(ctx.cwd, file))) {
        missingRequired.push(file)
      }
    }

    if (missingRequired.length > 0) {
      return {
        label: 'Project structure',
        status: 'error',
        detail: `Missing: ${missingRequired.join(', ')}`,
      }
    }

    for (const dir of COMMON_DIRS) {
      if (existsSync(join(ctx.cwd, dir))) {
        existingOptional.push(dir)
      }
    }

    for (const file of COMMON_FILES) {
      if (existsSync(join(ctx.cwd, file))) {
        existingOptional.push(file)
      }
    }

    const hasApp = existsSync(join(ctx.cwd, 'app')) || existsSync(join(ctx.cwd, 'App.tsx')) || existsSync(join(ctx.cwd, 'App.js'))
    const hasExpoRouter = existsSync(join(ctx.cwd, 'app', '_layout.tsx')) || existsSync(join(ctx.cwd, 'app', '_layout.js'))

    let projectType = 'React Native'
    if (hasExpoRouter) {
      projectType = 'Expo Router'
    } else if (existsSync(join(ctx.cwd, 'app.json'))) {
      projectType = 'Expo'
    }

    return {
      label: 'Project structure',
      status: 'success',
      detail: `${projectType} project`,
    }
  },
}
