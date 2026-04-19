const STORAGE_KEY = 'cb_dashboard_readiness_v1'
const DEFAULT_TTL_MS = 5 * 60 * 1000

export type CachedReadinessPayload = {
  gymId: string
  savedAt: number
  required: Array<{
    key: string
    label: string
    passed: boolean
    reason: string | null
    deepLink: string
  }>
  optional: Array<{
    key: string
    label: string
    passed: boolean
    nudgeText: string
    deepLink: string
  }>
  canGoLive: boolean
}

export function readReadinessSessionCache(
  gymId: string,
  maxAgeMs: number = DEFAULT_TTL_MS
): CachedReadinessPayload | null {
  if (typeof window === 'undefined' || !gymId) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedReadinessPayload
    if (parsed.gymId !== gymId) return null
    if (!Array.isArray(parsed.required)) return null
    if (Date.now() - parsed.savedAt > maxAgeMs) return null
    return parsed
  } catch {
    return null
  }
}

export function writeReadinessSessionCache(payload: Omit<CachedReadinessPayload, 'savedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const full: CachedReadinessPayload = { ...payload, savedAt: Date.now() }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(full))
  } catch {
    // quota / private mode
  }
}

/** Call after onboarding changes so the next dashboard visit refetches fresh readiness. */
export function clearReadinessSessionCache(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
