import { resolve } from 'path'
import type { BenchmarkRun } from './types'

const DATA_DIR = resolve(import.meta.dir, '../data')

export async function saveBenchmarkRun(run: BenchmarkRun): Promise<void> {
  const filename = `${run.id}.json`
  const filepath = resolve(DATA_DIR, filename)
  await Bun.write(filepath, JSON.stringify(run, null, 2))
}

export async function getBenchmarkRun(id: string): Promise<BenchmarkRun | null> {
  const filepath = resolve(DATA_DIR, `${id}.json`)
  const file = Bun.file(filepath)

  if (!(await file.exists())) {
    return null
  }

  return file.json()
}

export async function getAllBenchmarkRuns(): Promise<BenchmarkRun[]> {
  const runs: BenchmarkRun[] = []
  const glob = new Bun.Glob('*.json')

  for await (const filename of glob.scan(DATA_DIR)) {
    try {
      const filepath = resolve(DATA_DIR, filename)
      const file = Bun.file(filepath)
      const run = await file.json() as BenchmarkRun
      runs.push(run)
    } catch {
    }
  }

  runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return runs
}

export async function deleteBenchmarkRun(id: string): Promise<boolean> {
  const filepath = resolve(DATA_DIR, `${id}.json`)
  const file = Bun.file(filepath)

  if (!(await file.exists())) {
    return false
  }

  await Bun.$`rm ${filepath}`
  return true
}

export async function getLatestRun(): Promise<BenchmarkRun | null> {
  const runs = await getAllBenchmarkRuns()
  return runs[0] ?? null
}
