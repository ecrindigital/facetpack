export interface BenchmarkRun {
  id: string
  timestamp: string
  git: {
    commit: string
    branch: string
  }
  environment: {
    platform: string
    arch: string
    bun: string
    node: string
    cpu: string
    cores: number
    memory: string
  }
  summary: BenchmarkSummary
  categories: BenchmarkCategory[]
}

export interface BenchmarkSummary {
  totalTests: number
  avgSpeedup: number
  maxSpeedup: number
  totalTimeSaved: number
  bundleSizeReduction?: number
}

export interface BenchmarkCategory {
  id: string
  name: string
  description: string
  icon: string
  results: BenchmarkResult[]
}

export interface BenchmarkResult {
  id: string
  name: string
  description: string
  projectType: 'basic' | 'complex' | 'real-world'
  projectSize: string
  variants: BenchmarkVariant[]
  winner: string
  speedup: number
  metadata?: Record<string, unknown>
}

export interface BenchmarkVariant {
  name: string
  tool: 'babel' | 'facetpack' | 'terser' | 'esbuild' | 'enhanced-resolve' | 'oxc'
  color: string
  metrics: BenchmarkMetrics
}

export interface BenchmarkMetrics {
  mean: number
  median: number
  min: number
  max: number
  p75: number
  p95: number
  p99: number
  stdDev: number
  samples: number
  ops: number
  throughput?: number
  memoryUsage?: number
  outputSize?: number
}

export interface RunnerConfig {
  categories?: string[]
  iterations?: number
  warmupIterations?: number
  includeMemory?: boolean
  verbose?: boolean
}

export interface ProgressEvent {
  type: 'start' | 'category' | 'test' | 'complete' | 'error'
  category?: string
  test?: string
  progress?: number
  total?: number
  result?: BenchmarkResult
}

export type ProgressCallback = (event: ProgressEvent) => void
