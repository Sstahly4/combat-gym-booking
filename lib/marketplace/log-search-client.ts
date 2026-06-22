import {
  getLastSearchDestination,
  getLastSearchEventId,
  getSearchSessionId,
  setLastSearchDestination,
  setLastSearchEventId,
} from '@/lib/marketplace/search-session'

export type LogSearchEventInput = {
  destination_input?: string | null
  resolved_latitude?: number | null
  resolved_longitude?: number | null
  disciplines?: string[]
  start_date?: string | null
  end_date?: string | null
  results_count: number
  primary_results_count?: number
  nearby_results_count?: number
}

function postJson(path: string, body: unknown): void {
  if (typeof window === 'undefined') return
  void fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {})
}

function patchJson(path: string, body: unknown): void {
  if (typeof window === 'undefined') return
  void fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {})
}

/** Log a search execution and track city-switch substitutions in the same session. */
export function logSearchEvent(input: LogSearchEventInput): void {
  const search_session_id = getSearchSessionId()
  const destination = input.destination_input?.trim() || ''
  const previousDestination = getLastSearchDestination()

  if (
    destination &&
    previousDestination &&
    previousDestination.toLowerCase() !== destination.toLowerCase()
  ) {
    postJson('/api/marketplace/substitutions', {
      search_session_id,
      kind: 'city_switch',
      from_destination: previousDestination,
      to_destination: destination,
    })
  }

  if (destination) {
    setLastSearchDestination(destination)
  }

  void fetch('/api/marketplace/search-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      search_session_id,
      ...input,
    }),
    keepalive: true,
  })
    .then((res) => res.json())
    .then((json: { event_id?: string | null }) => {
      if (json?.event_id) setLastSearchEventId(json.event_id)
    })
    .catch(() => {})
}

export function logSearchGymClick(gymId: string, options?: { fromNearby?: boolean }): void {
  const eventId = getLastSearchEventId()
  const search_session_id = getSearchSessionId()
  const fromNearby = options?.fromNearby ?? false

  if (eventId) {
    patchJson('/api/marketplace/search-events', {
      event_id: eventId,
      gym_id: gymId,
      clicked_from_nearby: fromNearby,
    })
  }

  postJson('/api/marketplace/substitutions', {
    search_session_id,
    kind: fromNearby ? 'nearby_gym_click' : 'search_gym_click',
    from_destination: getLastSearchDestination(),
    to_gym_id: gymId,
    search_event_id: eventId,
  })
}

/** Calendar exploration before the traveler commits to a search. */
export function logSearchDateChange(input: {
  source: 'search_bar' | 'search_page'
  start_date?: string | null
  end_date?: string | null
  metadata?: Record<string, unknown>
}): void {
  postJson('/api/marketplace/search-date-events', {
    search_session_id: getSearchSessionId(),
    source: input.source,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    metadata: input.metadata ?? {},
  })
}
