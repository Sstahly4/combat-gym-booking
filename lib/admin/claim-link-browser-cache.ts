/** Browser-only cache for claim URLs (shown once at generation; not stored server-side). */

const STORAGE_KEY = 'combatstay:admin:claim-links:v1'

export type CachedClaimLink = {
  gymId: string
  tokenId: string
  url: string
  savedAt: string
}

type CacheMap = Record<string, CachedClaimLink>

function readAll(): CacheMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as CacheMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map: CacheMap): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode */
  }
}

export function saveClaimLinkToBrowserCache(entry: CachedClaimLink): void {
  const map = readAll()
  map[entry.gymId] = entry
  writeAll(map)
}

/** Returns cached URL when it matches the current token row. */
export function getCachedClaimLinkUrl(gymId: string, tokenId: string): string | null {
  const entry = readAll()[gymId]
  if (!entry || entry.tokenId !== tokenId) return null
  return entry.url
}
