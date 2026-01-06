import type { Check } from './types'

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
