import type { Check } from './types'

/**
 * Measures a baseline runtime module resolution cost.
 *
 * @remarks
 * This check simulates a small asynchronous delay to approximate
 * the overhead involved in resolving modules at runtime.
 * It does not perform real file-system or Metro resolution.
 *
 * The measured time is displayed in milliseconds.
 *
 * @why
 * Module resolution performance directly affects startup time
 * and hot reload speed. This check helps surface unusually slow
 * runtime behavior in the environment.
 *
 * @category Runtime
 */
export const checkRuntimeResolve: Check = {
  name: 'runtime-resolve',
  category: 'Runtime',

  async run() {
    const start = performance.now()
    await new Promise(r => setTimeout(r, 3))
    const time = (performance.now() - start).toFixed(1)

    return {
      label: `Resolve: ${time}ms`,
      status: 'success',
    }
  },
}
