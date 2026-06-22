import { createAdminClient } from '@/lib/supabase/admin'
import { searchLeadTimeDays, type FighterProfileSnapshot } from '@/lib/marketplace/marketplace-analytics'

export type SearchEventInsert = {
  search_session_id: string
  user_id?: string | null
  destination_input?: string | null
  resolved_latitude?: number | null
  resolved_longitude?: number | null
  disciplines?: string[]
  start_date?: string | null
  end_date?: string | null
  results_count: number
  primary_results_count?: number
  nearby_results_count?: number
  fighter_profile?: FighterProfileSnapshot | null
  metadata?: Record<string, unknown>
}

export type SearchDateEventInsert = {
  search_session_id: string
  user_id?: string | null
  source: 'search_bar' | 'search_page'
  start_date?: string | null
  end_date?: string | null
  metadata?: Record<string, unknown>
}

export type SubstitutionInsert = {
  search_session_id: string
  user_id?: string | null
  kind: 'city_switch' | 'nearby_gym_click' | 'search_gym_click'
  from_destination?: string | null
  to_destination?: string | null
  from_gym_id?: string | null
  to_gym_id?: string | null
  search_event_id?: string | null
  metadata?: Record<string, unknown>
}

let loggedMissingSearchEventsTable = false

function isMissingTableError(error: unknown, table: string): boolean {
  const e = error as { code?: string; message?: string }
  if (e?.code === 'PGRST205') return true
  const msg = typeof e?.message === 'string' ? e.message : ''
  return /Could not find the table/i.test(msg) && msg.includes(table)
}

/** Best-effort insert; never throws to callers. */
export async function recordSearchEvent(row: SearchEventInsert): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const leadTimeDays = searchLeadTimeDays(row.start_date)
    const metadata = {
      ...(row.metadata ?? {}),
      ...(row.fighter_profile ? { fighter_profile: row.fighter_profile } : {}),
    }
    const { data, error } = await admin
      .from('search_events')
      .insert({
        search_session_id: row.search_session_id,
        user_id: row.user_id ?? null,
        destination_input: row.destination_input?.trim() || null,
        resolved_latitude: row.resolved_latitude ?? null,
        resolved_longitude: row.resolved_longitude ?? null,
        disciplines: row.disciplines ?? [],
        start_date: row.start_date || null,
        end_date: row.end_date || null,
        lead_time_days: leadTimeDays,
        results_count: row.results_count,
        primary_results_count: row.primary_results_count ?? row.results_count,
        nearby_results_count: row.nearby_results_count ?? 0,
        metadata,
      })
      .select('id')
      .single()

    if (error) {
      if (isMissingTableError(error, 'search_events')) {
        if (!loggedMissingSearchEventsTable) {
          loggedMissingSearchEventsTable = true
          console.info('[marketplace] search_events table missing — apply migration 20260622220000')
        }
        return null
      }
      console.warn('[marketplace] search_events insert failed', error)
      return null
    }
    return data?.id ?? null
  } catch (err) {
    console.warn('[marketplace] search_events threw', err)
    return null
  }
}

export async function recordSearchEventClick(input: {
  event_id: string
  gym_id: string
  clicked_from_nearby: boolean
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('search_events')
      .update({
        clicked_gym_id: input.gym_id,
        clicked_from_nearby: input.clicked_from_nearby,
      })
      .eq('id', input.event_id)

    if (error && !isMissingTableError(error, 'search_events')) {
      console.warn('[marketplace] search_events click update failed', error)
    }
  } catch (err) {
    console.warn('[marketplace] search_events click threw', err)
  }
}

export async function recordDestinationSubstitution(row: SubstitutionInsert): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('destination_substitutions').insert({
      search_session_id: row.search_session_id,
      user_id: row.user_id ?? null,
      kind: row.kind,
      from_destination: row.from_destination?.trim() || null,
      to_destination: row.to_destination?.trim() || null,
      from_gym_id: row.from_gym_id ?? null,
      to_gym_id: row.to_gym_id ?? null,
      search_event_id: row.search_event_id ?? null,
      metadata: row.metadata ?? {},
    })

    if (error && !isMissingTableError(error, 'destination_substitutions')) {
      console.warn('[marketplace] destination_substitutions insert failed', error)
    }
  } catch (err) {
    console.warn('[marketplace] destination_substitutions threw', err)
  }
}

let loggedMissingSearchDateEventsTable = false

export async function recordSearchDateEvent(row: SearchDateEventInsert): Promise<void> {
  try {
    const admin = createAdminClient()
    const leadTimeDays = searchLeadTimeDays(row.start_date)
    const { error } = await admin.from('search_date_events').insert({
      search_session_id: row.search_session_id,
      user_id: row.user_id ?? null,
      source: row.source,
      start_date: row.start_date || null,
      end_date: row.end_date || null,
      lead_time_days: leadTimeDays,
      metadata: row.metadata ?? {},
    })

    if (error) {
      if (isMissingTableError(error, 'search_date_events')) {
        if (!loggedMissingSearchDateEventsTable) {
          loggedMissingSearchDateEventsTable = true
          console.info('[marketplace] search_date_events table missing — apply migration 20260622230000')
        }
        return
      }
      console.warn('[marketplace] search_date_events insert failed', error)
    }
  } catch (err) {
    console.warn('[marketplace] search_date_events threw', err)
  }
}
