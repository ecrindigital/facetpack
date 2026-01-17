import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const ANSI = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
} as const

interface TransformerStats {
  oxc: number
  babel: number
}

interface ResolverStats {
  facetpack: number
  metro: number
}

interface MinifierStats {
  files: number
  originalSize: number
  minifiedSize: number
}

interface TreeShakingStats {
  modulesAnalyzed: number
  modulesRemoved: number
  exportsRemoved: number
}

interface FacetpackStats {
  transformer: TransformerStats
  resolver: ResolverStats
  minifier: MinifierStats
  treeShaking: TreeShakingStats
  startTime: number
}

const STATS_DIR = join(tmpdir(), 'facetpack-stats')
const STATS_FILE_PREFIX = 'stats-'
const LOCK_FILE = join(STATS_DIR, '.print-lock')
const PRINT_DELAY = 1000

function getStatsFilePath(): string {
  const workerId = process.env.METRO_WORKER_ID || process.pid.toString()
  return join(STATS_DIR, `${STATS_FILE_PREFIX}${workerId}.json`)
}

function ensureStatsDir(): void {
  if (!existsSync(STATS_DIR)) {
    mkdirSync(STATS_DIR, { recursive: true })
  }
}

function acquirePrintLock(): boolean {
  try {
    ensureStatsDir()
    if (existsSync(LOCK_FILE)) {
      const lockTime = parseInt(readFileSync(LOCK_FILE, 'utf-8'), 10)
      if (Date.now() - lockTime < 5000) {
        return false
      }
    }
    writeFileSync(LOCK_FILE, Date.now().toString())
    return true
  } catch {
    return false
  }
}

function releasePrintLock(): void {
  try {
    if (existsSync(LOCK_FILE)) {
      unlinkSync(LOCK_FILE)
    }
  } catch {}
}

class GlobalStats {
  private stats: FacetpackStats = this.createEmptyStats()
  private exitHandlerRegistered = false
  private hasPrinted = false
  private printTimer: ReturnType<typeof setTimeout> | null = null

  private createEmptyStats(): FacetpackStats {
    return {
      transformer: { oxc: 0, babel: 0 },
      resolver: { facetpack: 0, metro: 0 },
      minifier: { files: 0, originalSize: 0, minifiedSize: 0 },
      treeShaking: { modulesAnalyzed: 0, modulesRemoved: 0, exportsRemoved: 0 },
      startTime: Date.now(),
    }
  }

  recordTransform(engine: 'oxc' | 'babel'): void {
    this.stats.transformer[engine]++
    this.persistStats()
    this.schedulePrint()
  }

  adjustTransformFallback(): void {
    this.stats.transformer.oxc--
    this.stats.transformer.babel++
    this.persistStats()
  }

  recordResolve(engine: 'facetpack' | 'metro'): void {
    this.stats.resolver[engine]++
  }

  flush(): void {
    this.persistStats()
  }

  schedulePrint(): void {
    if (this.printTimer) {
      clearTimeout(this.printTimer)
    }
    this.printTimer = setTimeout(() => {
      if (acquirePrintLock()) {
        this.print()
        releasePrintLock()
      }
    }, PRINT_DELAY)
  }

  recordMinify(originalSize: number, minifiedSize: number): void {
    this.stats.minifier.files++
    this.stats.minifier.originalSize += originalSize
    this.stats.minifier.minifiedSize += minifiedSize
  }

  recordTreeShaking(analyzed: number, removed: number, exports: number): void {
    this.stats.treeShaking.modulesAnalyzed += analyzed
    this.stats.treeShaking.modulesRemoved += removed
    this.stats.treeShaking.exportsRemoved += exports
  }

  get(): FacetpackStats {
    return JSON.parse(JSON.stringify(this.stats))
  }

  reset(): void {
    this.stats = this.createEmptyStats()
    this.hasPrinted = false
    this.cleanupStatsFiles()
  }

  private persistStats(): void {
    try {
      ensureStatsDir()
      writeFileSync(getStatsFilePath(), JSON.stringify(this.stats))
    } catch {}
  }

  private cleanupStatsFiles(): void {
    try {
      if (existsSync(STATS_DIR)) {
        const { readdirSync } = require('fs')
        const files = readdirSync(STATS_DIR) as string[]
        for (const file of files) {
          if (file.startsWith(STATS_FILE_PREFIX)) {
            try {
              unlinkSync(join(STATS_DIR, file))
            } catch {}
          }
        }
      }
    } catch {}
  }

  aggregateWorkerStats(): FacetpackStats {
    const aggregated = this.createEmptyStats()
    aggregated.startTime = this.stats.startTime

    try {
      if (existsSync(STATS_DIR)) {
        const { readdirSync } = require('fs')
        const files = readdirSync(STATS_DIR) as string[]

        for (const file of files) {
          if (file.startsWith(STATS_FILE_PREFIX)) {
            try {
              const content = readFileSync(join(STATS_DIR, file), 'utf-8')
              const workerStats = JSON.parse(content) as FacetpackStats

              aggregated.transformer.oxc += workerStats.transformer.oxc
              aggregated.transformer.babel += workerStats.transformer.babel
              aggregated.resolver.facetpack += workerStats.resolver.facetpack
              aggregated.resolver.metro += workerStats.resolver.metro

              if (workerStats.startTime < aggregated.startTime) {
                aggregated.startTime = workerStats.startTime
              }
            } catch {}
          }
        }
      }
    } catch {}

    aggregated.minifier = this.stats.minifier
    aggregated.treeShaking = this.stats.treeShaking

    return aggregated
  }

  private formatPercent(value: number, total: number): string {
    if (total === 0) return '0.0'
    return ((value / total) * 100).toFixed(1)
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  print(): void {
    if (!process.env.FACETPACK_DEBUG || this.hasPrinted) return

    const aggregated = this.aggregateWorkerStats()
    const { transformer, resolver, minifier, treeShaking, startTime } = aggregated
    const duration = Date.now() - startTime

    const transformTotal = transformer.oxc + transformer.babel
    const resolveTotal = resolver.facetpack + resolver.metro

    if (transformTotal === 0 && resolveTotal === 0 && minifier.files === 0) return

    this.hasPrinted = true

    const { cyan, green, yellow, white, gray, bold, dim, reset } = ANSI

    console.log('\n')
    console.log(`${bold}${cyan}╔════════════════════════════════════════════════════════════════════╗${reset}`)
    console.log(`${bold}${cyan}║${reset}                    ${bold}FACETPACK BUNDLE STATS${reset}                         ${cyan}║${reset}`)
    console.log(`${bold}${cyan}╠════════════════════════════════════════════════════════════════════╣${reset}`)

    if (transformTotal > 0) {
      const oxcPct = this.formatPercent(transformer.oxc, transformTotal)
      const babelPct = this.formatPercent(transformer.babel, transformTotal)
      console.log(`${cyan}║${reset}                                                                    ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${bold}TRANSFORMER${reset}                                                      ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${green}●${reset} OXC (native)    ${bold}${green}${transformer.oxc.toString().padStart(6)}${reset} files   ${green}${oxcPct.padStart(6)}%${reset}                 ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${yellow}●${reset} Babel           ${bold}${yellow}${transformer.babel.toString().padStart(6)}${reset} files   ${yellow}${babelPct.padStart(6)}%${reset}                 ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${dim}${white}  Total           ${transformTotal.toString().padStart(6)} files${reset}                            ${cyan}║${reset}`)
    }

    if (resolveTotal > 0) {
      const fpPct = this.formatPercent(resolver.facetpack, resolveTotal)
      const metroPct = this.formatPercent(resolver.metro, resolveTotal)
      console.log(`${cyan}║${reset}                                                                    ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${bold}RESOLVER${reset}                                                         ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${green}●${reset} Facetpack       ${bold}${green}${resolver.facetpack.toString().padStart(6)}${reset} hits    ${green}${fpPct.padStart(6)}%${reset}                 ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${yellow}●${reset} Metro           ${bold}${yellow}${resolver.metro.toString().padStart(6)}${reset} hits    ${yellow}${metroPct.padStart(6)}%${reset}                 ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${dim}${white}  Total           ${resolveTotal.toString().padStart(6)} resolutions${reset}                      ${cyan}║${reset}`)
    }

    if (minifier.files > 0) {
      const savings = minifier.originalSize - minifier.minifiedSize
      const savingsPct = this.formatPercent(savings, minifier.originalSize)
      console.log(`${cyan}║${reset}                                                                    ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${bold}MINIFIER${reset}                                                         ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${green}●${reset} Files minified  ${bold}${green}${minifier.files.toString().padStart(6)}${reset}                                   ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${gray}●${reset} Original size   ${this.formatSize(minifier.originalSize).padStart(12)}                             ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${green}●${reset} Minified size   ${this.formatSize(minifier.minifiedSize).padStart(12)}  ${green}-${savingsPct}%${reset}                    ${cyan}║${reset}`)
    }

    if (treeShaking.modulesAnalyzed > 0) {
      console.log(`${cyan}║${reset}                                                                    ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${bold}TREE SHAKING${reset}                                                     ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${gray}●${reset} Modules analyzed ${bold}${treeShaking.modulesAnalyzed.toString().padStart(5)}${reset}                                   ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${green}●${reset} Modules removed  ${bold}${green}${treeShaking.modulesRemoved.toString().padStart(5)}${reset}                                   ${cyan}║${reset}`)
      console.log(`${cyan}║${reset}  ${green}●${reset} Exports removed  ${bold}${green}${treeShaking.exportsRemoved.toString().padStart(5)}${reset}                                   ${cyan}║${reset}`)
    }

    console.log(`${cyan}║${reset}                                                                    ${cyan}║${reset}`)
    console.log(`${cyan}║${reset}  ${dim}Duration: ${this.formatDuration(duration)}${reset}                                             ${cyan}║${reset}`)
    console.log(`${bold}${cyan}╚════════════════════════════════════════════════════════════════════╝${reset}`)
    console.log('\n')

    this.cleanupStatsFiles()
  }

  registerExitHandler(): void {
    if (this.exitHandlerRegistered) return
    this.exitHandlerRegistered = true

    process.on('SIGINT', () => {
      this.print()
      process.exit(0)
    })
    process.on('beforeExit', () => this.print())
  }
}

export const globalStats = new GlobalStats()

export function printStats(): void {
  globalStats.print()
}

export function resetStats(): void {
  globalStats.reset()
}

export function getStats(): FacetpackStats {
  return globalStats.get()
}
