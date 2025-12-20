interface CachedResolution {
  path: string | null
  timestamp: number
}

const resolutionCache = new Map<string, Map<string, CachedResolution>>()

const CACHE_TTL = 30000 // 30 seconds

export function setCachedResolutions(
  originModulePath: string,
  resolutions: Map<string, string | null>
): void {
  const now = Date.now()
  const cached = new Map<string, CachedResolution>()

  for (const [specifier, path] of resolutions) {
    cached.set(specifier, { path, timestamp: now })
  }

  resolutionCache.set(originModulePath, cached)
}

export function getCachedResolution(
  originModulePath: string,
  specifier: string
): string | null | undefined {
  const fileCache = resolutionCache.get(originModulePath)
  if (!fileCache) return undefined

  const cached = fileCache.get(specifier)
  if (!cached) return undefined

  // Check TTL
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    fileCache.delete(specifier)
    return undefined
  }

  return cached.path
}

export function clearCache(): void {
  resolutionCache.clear()
}

export function getCacheStats(): { files: number; resolutions: number } {
  let resolutions = 0
  for (const fileCache of resolutionCache.values()) {
    resolutions += fileCache.size
  }
  return { files: resolutionCache.size, resolutions }
}
