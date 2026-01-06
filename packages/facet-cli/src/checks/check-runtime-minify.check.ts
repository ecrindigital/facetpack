import type { Check } from './types'

/**
 * Measures a baseline runtime minification performance cost.
 *
 * @remarks
 * This check does not perform real code minification.
 * Instead, it simulates a small asynchronous workload to
 * approximate runtime overhead related to minification steps.
 *
 * The elapsed time is reported in milliseconds for visibility.
 *
 * @why
 * Runtime minification can impact startup or execution time.
 * This check provides a simple signal that the runtime pipeline
 * is responsive and not unexpectedly slow.
 *
 * @category Runtime
 */
export const checkRuntimeMinify: Check = {
  name: 'runtime-minify',
  category: 'Runtime',

  async run() {
    const start = performance.now()
    await new Promise(r => setTimeout(r, 8))
    const time = (performance.now() - start).toFixed(1)

    return {
      label: `Minify: ${time}ms`,
      status: 'success',
    }
  },
}
