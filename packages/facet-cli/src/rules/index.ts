import type { CategoryCheck, RuleContext, CheckResult } from './types'
import { environment } from './checks/environment'
import { installation } from './checks/installation'
import { metro } from './checks/metro'
import { packages } from './checks/packages'
import { runtime } from './checks/runtime'

export type { CategoryCheck, RuleContext, CheckResult }

export const categories: CategoryCheck[] = [
  environment,
  installation,
  metro,
  packages,
  runtime,
]
