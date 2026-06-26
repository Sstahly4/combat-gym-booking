import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchClaimLinkAnalytics,
  type ClaimLinkAnalyticsPayload,
} from '@/lib/admin/fetch-claim-link-analytics'

export type AnalyticsRange = '7d' | '28d' | '90d'

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '28d': 28,
  '90d': 90,
}

export function parseAnalyticsRange(raw: string | null | undefined): AnalyticsRange {
  if (raw === '28d' || raw === '90d') return raw
  return '7d'
}

export type DailySeries = {
  /** ISO date labels (UTC), oldest → newest */
  labels: string[]
  values: number[]
}

export type RankedRow = {
  label: string
  count: number
  meta?: string
}

export type CatalogRow = {
  id: string
  event: string
  table: string
  whenFired: string
  keyFields: string
  count7d: number | null
  status: 'ok' | 'missing' | 'empty'
}

export type AdminAnalyticsPayload = {
  range: AnalyticsRange
  period: { start: string; end: string }
  comparePeriod: { start: string; end: string }
  health: {
    searchEvents: boolean
    searchDateEvents: boolean
    destinationSubstitutions: boolean
    bookingPriceSnapshots: boolean
  }
  kpis: {
    searches: { current: number; previous: number; daily: DailySeries }
    ctr: { current: number; previous: number }
    bookings: { current: number; previous: number; daily: DailySeries }
    zeroResultRate: { current: number; previous: number }
  }
  discovery: {
    searchVolume: DailySeries
    primaryVsNearby: { primary: number; nearby: number }
    topDestinations: RankedRow[]
    substitutions: RankedRow[]
    supplyGaps: RankedRow[]
    clicks: number
  }
  catalog: CatalogRow[]
  claimLinks: ClaimLinkAnalyticsPayload
}

function isMissingTableError(error: unknown, table: string): boolean {
  const e = error as { code?: string; message?: string }
  if (e?.code === 'PGRST205') return true
  const msg = typeof e?.message === 'string' ? e.message : ''
  return /Could not find the table/i.test(msg) && msg.includes(table)
}

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function addUtcDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

function buildDailyLabels(end: Date, dayCount: number): string[] {
  const endDay = startOfUtcDay(end)
  const labels: string[] = []
  for (let i = dayCount - 1; i >= 0; i--) {
    labels.push(utcDayKey(addUtcDays(endDay, -i)))
  }
  return labels
}

function bucketByDay(
  rows: Array<{ created_at: string }>,
  labels: string[],
): number[] {
  const index = new Map(labels.map((l, i) => [l, i]))
  const values = Array(labels.length).fill(0)
  for (const row of rows) {
    const key = utcDayKey(new Date(row.created_at))
    const idx = index.get(key)
    if (idx !== undefined) values[idx] += 1
  }
  return values
}

function bucketBookingsByDay(
  rows: Array<{ request_submitted_at?: string | null; created_at: string }>,
  labels: string[],
): number[] {
  const index = new Map(labels.map((l, i) => [l, i]))
  const values = Array(labels.length).fill(0)
  for (const row of rows) {
    const ts = row.request_submitted_at || row.created_at
    const key = utcDayKey(new Date(ts))
    const idx = index.get(key)
    if (idx !== undefined) values[idx] += 1
  }
  return values
}

function pctRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

type SearchRow = {
  created_at: string
  destination_input: string | null
  results_count: number
  clicked_gym_id: string | null
  primary_results_count: number
  nearby_results_count: number
  start_date: string | null
}

async function safeCount(
  supabase: SupabaseClient,
  table: string,
  sinceIso: string,
): Promise<{ count: number | null; missing: boolean }> {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sinceIso)

  if (error) {
    if (isMissingTableError(error, table)) return { count: null, missing: true }
    console.warn(`[admin/analytics] count ${table}`, error)
    return { count: 0, missing: false }
  }
  return { count: count ?? 0, missing: false }
}

export async function fetchAdminAnalytics(
  supabase: SupabaseClient,
  range: AnalyticsRange,
): Promise<AdminAnalyticsPayload> {
  const dayCount = RANGE_DAYS[range]
  const now = new Date()
  const periodEnd = now
  const periodStart = addUtcDays(startOfUtcDay(now), -(dayCount - 1))
  const compareEnd = addUtcDays(periodStart, -1)
  const compareStart = addUtcDays(startOfUtcDay(compareEnd), -(dayCount - 1))

  const periodStartIso = periodStart.toISOString()
  const compareStartIso = compareStart.toISOString()
  const compareEndIso = addUtcDays(startOfUtcDay(compareEnd), 1).toISOString()

  const labels = buildDailyLabels(periodEnd, dayCount)

  const health = {
    searchEvents: true,
    searchDateEvents: true,
    destinationSubstitutions: true,
    bookingPriceSnapshots: true,
  }

  let searchCurrent: SearchRow[] = []
  let searchPrevious: SearchRow[] = []

  const searchCurrentRes = await supabase
    .from('search_events')
    .select(
      'created_at, destination_input, results_count, clicked_gym_id, primary_results_count, nearby_results_count, start_date',
    )
    .gte('created_at', periodStartIso)

  if (searchCurrentRes.error) {
    if (isMissingTableError(searchCurrentRes.error, 'search_events')) {
      health.searchEvents = false
    } else {
      console.warn('[admin/analytics] search_events current', searchCurrentRes.error)
    }
  } else {
    searchCurrent = (searchCurrentRes.data ?? []) as SearchRow[]
  }

  if (health.searchEvents) {
    const searchPrevRes = await supabase
      .from('search_events')
      .select(
        'created_at, destination_input, results_count, clicked_gym_id, primary_results_count, nearby_results_count, start_date',
      )
      .gte('created_at', compareStartIso)
      .lt('created_at', periodStartIso)

    if (!searchPrevRes.error) {
      searchPrevious = (searchPrevRes.data ?? []) as SearchRow[]
    }
  }

  const clicksCurrent = searchCurrent.filter((r) => r.clicked_gym_id).length
  const clicksPrevious = searchPrevious.filter((r) => r.clicked_gym_id).length
  const zeroCurrent = searchCurrent.filter((r) => r.results_count === 0).length
  const zeroPrevious = searchPrevious.filter((r) => r.results_count === 0).length

  let bookingsCurrent: Array<{ request_submitted_at?: string | null; created_at: string }> = []
  let bookingsPrevious: Array<{ request_submitted_at?: string | null; created_at: string }> = []

  const bookingsCurrentRes = await supabase
    .from('bookings')
    .select('request_submitted_at, created_at')
    .gte('created_at', periodStartIso)

  if (!bookingsCurrentRes.error) {
    bookingsCurrent = bookingsCurrentRes.data ?? []
  }

  const bookingsPrevRes = await supabase
    .from('bookings')
    .select('request_submitted_at, created_at')
    .gte('created_at', compareStartIso)
    .lt('created_at', periodStartIso)

  if (!bookingsPrevRes.error) {
    bookingsPrevious = bookingsPrevRes.data ?? []
  }

  const destCounts = new Map<string, number>()
  for (const row of searchCurrent) {
    const dest = row.destination_input?.trim()
    if (!dest) continue
    destCounts.set(dest, (destCounts.get(dest) ?? 0) + 1)
  }
  const topDestinations: RankedRow[] = [...destCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label, count]) => ({ label, count }))

  const gapCounts = new Map<string, { count: number; dates: Set<string> }>()
  for (const row of searchCurrent.filter((r) => r.results_count === 0)) {
    const dest = row.destination_input?.trim() || 'Unknown'
    const key = dest
    const entry = gapCounts.get(key) ?? { count: 0, dates: new Set<string>() }
    entry.count += 1
    if (row.start_date) entry.dates.add(row.start_date)
    gapCounts.set(key, entry)
  }
  const supplyGaps: RankedRow[] = [...gapCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([label, { count, dates }]) => ({
      label,
      count,
      meta: dates.size > 0 ? `${dates.size} date${dates.size === 1 ? '' : 's'}` : undefined,
    }))

  let substitutions: RankedRow[] = []
  const subRes = await supabase
    .from('destination_substitutions')
    .select('kind')
    .gte('created_at', periodStartIso)

  if (subRes.error) {
    if (isMissingTableError(subRes.error, 'destination_substitutions')) {
      health.destinationSubstitutions = false
    }
  } else {
    const subCounts = new Map<string, number>()
    for (const row of subRes.data ?? []) {
      const kind = String((row as { kind: string }).kind)
      subCounts.set(kind, (subCounts.get(kind) ?? 0) + 1)
    }
    substitutions = [...subCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }))
  }

  const primaryVsNearby = searchCurrent.reduce(
    (acc, row) => {
      acc.primary += row.primary_results_count ?? 0
      acc.nearby += row.nearby_results_count ?? 0
      return acc
    },
    { primary: 0, nearby: 0 },
  )

  const sevenDaysAgo = addUtcDays(startOfUtcDay(now), -6).toISOString()

  async function safeCountWhere(
    table: string,
    sinceIso: string,
    column: string,
    notNull = false,
  ): Promise<{ count: number | null; missing: boolean }> {
    let q = supabase.from(table).select('id', { count: 'exact', head: true }).gte('created_at', sinceIso)
    if (notNull) q = q.not(column, 'is', null)
    const { count, error } = await q
    if (error) {
      if (isMissingTableError(error, table)) return { count: null, missing: true }
      console.warn(`[admin/analytics] count ${table}`, error)
      return { count: 0, missing: false }
    }
    return { count: count ?? 0, missing: false }
  }

  async function countTelemetryEvent(
    eventType: string,
    sinceIso: string,
  ): Promise<{ count: number | null; missing: boolean }> {
    const { count, error } = await supabase
      .from('owner_telemetry_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso)
      .eq('event_type', eventType)
    if (error) {
      if (isMissingTableError(error, 'owner_telemetry_events')) return { count: null, missing: true }
      console.warn(`[admin/analytics] count owner_telemetry_events ${eventType}`, error)
      return { count: 0, missing: false }
    }
    return { count: count ?? 0, missing: false }
  }

  const [
    dateEvents7d,
    snapshots7d,
    substitutions7d,
    searchEvents7d,
    searchClicks7d,
    telemetry7d,
    claimGenerated7d,
    claimRedeemed7d,
    claimCompleted7d,
    claimLinks,
  ] = await Promise.all([
    safeCount(supabase, 'search_date_events', sevenDaysAgo),
    safeCount(supabase, 'booking_price_snapshots', sevenDaysAgo),
    safeCount(supabase, 'destination_substitutions', sevenDaysAgo),
    safeCount(supabase, 'search_events', sevenDaysAgo),
    safeCountWhere('search_events', sevenDaysAgo, 'clicked_gym_id', true),
    safeCount(supabase, 'owner_telemetry_events', sevenDaysAgo),
    countTelemetryEvent('gym_claim_link_generated', sevenDaysAgo),
    countTelemetryEvent('gym_claim_link_redeemed', sevenDaysAgo),
    countTelemetryEvent('gym_claim_password_set', sevenDaysAgo),
    fetchClaimLinkAnalytics(supabase, range),
  ])

  if (dateEvents7d.missing) health.searchDateEvents = false
  if (snapshots7d.missing) health.bookingPriceSnapshots = false

  function catalogStatus(count: number | null, tableHealthy: boolean): CatalogRow['status'] {
    if (!tableHealthy || count === null) return 'missing'
    if (count === 0) return 'empty'
    return 'ok'
  }

  const catalog: CatalogRow[] = [
    {
      id: 'search_events',
      event: 'Search executed',
      table: 'search_events',
      whenFired: '/search load and filter changes',
      keyFields: 'destination_input, disciplines, results_count, lead_time_days',
      count7d: searchEvents7d.count,
      status: catalogStatus(searchEvents7d.count, health.searchEvents),
    },
    {
      id: 'search_click',
      event: 'Gym result click',
      table: 'search_events (PATCH)',
      whenFired: 'Click on a search result card',
      keyFields: 'clicked_gym_id, clicked_from_nearby',
      count7d: searchClicks7d.count,
      status: catalogStatus(searchClicks7d.count, health.searchEvents),
    },
    {
      id: 'city_switch',
      event: 'Destination substitution',
      table: 'destination_substitutions',
      whenFired: 'Search bar city change or nearby gym click',
      keyFields: 'kind, from_destination, to_destination, to_gym_id',
      count7d: substitutions7d.count,
      status: catalogStatus(substitutions7d.count, health.destinationSubstitutions),
    },
    {
      id: 'search_date_events',
      event: 'Date picker exploration',
      table: 'search_date_events',
      whenFired: 'Calendar change in search bar',
      keyFields: 'start_date, end_date, lead_time_days',
      count7d: dateEvents7d.count,
      status: catalogStatus(dateEvents7d.count, health.searchDateEvents),
    },
    {
      id: 'booking_price_snapshots',
      event: 'Quote snapshot',
      table: 'booking_price_snapshots',
      whenFired: 'Booking create (checkout start)',
      keyFields: 'quoted_total, seasonal_premium_applied, lead_time_days',
      count7d: snapshots7d.count,
      status: catalogStatus(snapshots7d.count, health.bookingPriceSnapshots),
    },
    {
      id: 'owner_telemetry',
      event: 'Partner hub telemetry',
      table: 'owner_telemetry_events',
      whenFired: 'Onboarding, payouts, claim flows',
      keyFields: 'event_type, gym_id, metadata',
      count7d: telemetry7d.count,
      status: catalogStatus(telemetry7d.count, !telemetry7d.missing),
    },
    {
      id: 'claim_link_generated',
      event: 'Claim link issued',
      table: 'owner_telemetry_events',
      whenFired: 'Admin generates a gym claim link',
      keyFields: 'gym_id, expires_in_days',
      count7d: claimGenerated7d.count,
      status: catalogStatus(claimGenerated7d.count, !claimGenerated7d.missing),
    },
    {
      id: 'claim_link_redeemed',
      event: 'Claim link opened',
      table: 'owner_telemetry_events',
      whenFired: 'Owner clicks /claim/<token> and signs in',
      keyFields: 'gym_id, credentials_pending',
      count7d: claimRedeemed7d.count,
      status: catalogStatus(claimRedeemed7d.count, !claimGenerated7d.missing),
    },
    {
      id: 'claim_password_set',
      event: 'Claim completed',
      table: 'owner_telemetry_events',
      whenFired: 'Owner sets password via complete-claim',
      keyFields: 'gym_id, claim_token_burned',
      count7d: claimCompleted7d.count,
      status: catalogStatus(claimCompleted7d.count, !claimGenerated7d.missing),
    },
  ]

  return {
    range,
    period: { start: periodStartIso, end: periodEnd.toISOString() },
    comparePeriod: { start: compareStartIso, end: compareEndIso },
    health,
    kpis: {
      searches: {
        current: searchCurrent.length,
        previous: searchPrevious.length,
        daily: { labels, values: bucketByDay(searchCurrent, labels) },
      },
      ctr: {
        current: pctRate(clicksCurrent, searchCurrent.length),
        previous: pctRate(clicksPrevious, searchPrevious.length),
      },
      bookings: {
        current: bookingsCurrent.length,
        previous: bookingsPrevious.length,
        daily: { labels, values: bucketBookingsByDay(bookingsCurrent, labels) },
      },
      zeroResultRate: {
        current: pctRate(zeroCurrent, searchCurrent.length),
        previous: pctRate(zeroPrevious, searchPrevious.length),
      },
    },
    discovery: {
      searchVolume: { labels, values: bucketByDay(searchCurrent, labels) },
      primaryVsNearby,
      topDestinations,
      substitutions,
      supplyGaps,
      clicks: clicksCurrent,
    },
    catalog,
    claimLinks,
  }
}
