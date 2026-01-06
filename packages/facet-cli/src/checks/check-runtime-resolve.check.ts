import type { Check } from './types'

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
