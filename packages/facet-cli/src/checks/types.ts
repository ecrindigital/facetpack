/**
 * Possible status values returned by a doctor check.
 *
 * - `success`: Check passed successfully
 * - `warning`: Non-blocking issue detected
 * - `error`: Blocking issue that must be fixed
 * - `info`: Informational output only
 */
export type CheckStatus = 'success' | 'warning' | 'error' | 'info'

/**
 * Categories used to group doctor checks.
 *
 * These categories control how checks are grouped
 * and displayed in the `facet doctor` output.
 */
export type CheckCategory =
  | 'Environment'
  | 'Installation'
  | 'Metro'
  | 'Packages'
  | 'Runtime'

/**
 * Context object passed to every doctor check at runtime.
 *
 * @property cwd - Current working directory where the command is executed
 * @property packageJson - Parsed `package.json` contents, or `null` if not found
 * @property fix - Whether the `--fix` flag was provided
 */
export interface CheckContext {
  cwd: string
  packageJson: Record<string, unknown> | null
  fix: boolean
}

/**
 * Result returned by a doctor check.
 *
 * @property label - Human-readable label shown in CLI output
 * @property status - Status of the check
 * @property detail - Optional additional information or guidance
 */
export interface CheckResult {
  label: string
  status: CheckStatus
  detail?: string
}

/**
 * Definition of a single doctor check.
 *
 * Each check:
 * - belongs to a category
 * - has a unique name
 * - executes asynchronously
 *
 * Returning `null` indicates that the check
 * is not applicable in the current environment.
 */
export interface Check {
  name: string
  category: CheckCategory
  run: (ctx: CheckContext) => Promise<CheckResult | null>
}
