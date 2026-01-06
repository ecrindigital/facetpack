import type { Check } from './types'

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
