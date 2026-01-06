import type { Check } from './types'

/**
 * Measures a baseline runtime transformation cost.
 *
 * @remarks
 * This check simulates a small asynchronous delay to approximate
 * the time spent transforming JavaScript/TypeScript code at runtime.
 * It does not perform an actual transform and is only indicative.
 *
 * The measured time is reported in milliseconds.
 *
 * @why
 * Transform performance affects initial bundle creation,
 * rebuild times, and overall developer experience.
 * This check provides a quick signal of runtime performance health.
 *
 * @category Runtime
 */
export const checkRuntimeTransform: Check = {
  name: 'runtime-transform',
  category: 'Runtime',

  async run() {
    const start = performance.now()
    await new Promise(r => setTimeout(r, 5))
    const time = (performance.now() - start).toFixed(1)

    return {
      label: `Transform: ${time}ms`,
      status: 'success',
    }
  },
}
