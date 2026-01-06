import { createConsola } from 'consola'
import pc from 'picocolors'

export const logger = createConsola({
  formatOptions: {
    date: false,
  },
})

export const facetLog = (message: string, time?: number) => {
  const timeStr = time ? pc.dim(` (${time}ms)`) : ''
  logger.info(`${pc.cyan('[Facet]')} ${message}${timeStr}`)
}

export const facetSuccess = (message: string) => {
  logger.success(`${pc.cyan('[Facet]')} ${pc.green(message)}`)
}

export const facetError = (message: string) => {
  logger.error(`${pc.cyan('[Facet]')} ${pc.red(message)}`)
}

export const facetWarn = (message: string) => {
  logger.warn(`${pc.cyan('[Facet]')} ${pc.yellow(message)}`)
}

export const facetBox = (title: string, content?: string) => {
  logger.box({
    title: pc.cyan(title),
    message: content || '',
  })
}

export const formatTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}
