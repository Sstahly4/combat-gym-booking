const SESSION_KEY = 'cs_search_session_id'
const LAST_DESTINATION_KEY = 'cs_search_last_destination'
const LAST_EVENT_KEY = 'cs_search_last_event_id'

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Persists across page loads in the same browser tab (sessionStorage). */
export function getSearchSessionId(): string {
  if (typeof window === 'undefined') return newSessionId()
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = newSessionId()
    sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return newSessionId()
  }
}

export function getLastSearchDestination(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(LAST_DESTINATION_KEY)
  } catch {
    return null
  }
}

export function setLastSearchDestination(destination: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(LAST_DESTINATION_KEY, destination.trim())
  } catch {
    /* ignore */
  }
}

export function getLastSearchEventId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(LAST_EVENT_KEY)
  } catch {
    return null
  }
}

export function setLastSearchEventId(eventId: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(LAST_EVENT_KEY, eventId)
  } catch {
    /* ignore */
  }
}

export function getMarketplaceAttribution(): {
  search_session_id: string
  search_event_id: string | null
} {
  return {
    search_session_id: getSearchSessionId(),
    search_event_id: getLastSearchEventId(),
  }
}
