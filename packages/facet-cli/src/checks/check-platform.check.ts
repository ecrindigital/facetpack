import type { Check } from './types'

export const checkPlatform: Check = {
  name: 'platform',
  category: 'Environment',

  async run() {
    const platform = `${process.platform}-${process.arch}`

    return {
      label: `Platform ${platform}`,
      status: 'success',
    }
  },
}
