import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnalyticsRange, DailySeries } from '@/lib/admin/fetch-admin-analytics'

export type ClaimLinkActivityStatus =
  | 'awaiting_click'
  | 'opened'
  | 'claimed'
  | 'expired'
  | 'revoked'

export type ClaimLinkActivityRow = {
  gym_id: string
  gym_name: string
  city: string | null
  country: string | null
  token_created_at: string
  first_clicked_at: string | null
  claimed_at: string | null
  expires_at: string
  status: ClaimLinkActivityStatus
}

export type ClaimLinkAnalyticsPayload = {
  health: { tokens: boolean; telemetry: boolean }
  funnel: {
    issued: { current: number; previous: number }
    clicked: { current: number; previous: number }
    claimed: { current: number; previous: number }
    clickRate: { current: number; previous: number }
    claimRate: { current: number; previous: number }
    completionFromClick: { current: number; previous: number }
  }
  daily: DailySeries & {
    issued: number[]
    clicked: number[]
    claimed: number[]
  }
  pipeline: {
    active: number
    openedAwaitingClaim: number
    expired: number
    revoked: number
  }
  recent: ClaimLinkActivityRow[]
}

type TokenRow = {
  id: string
  gym_id: string
  created_at: string
  expires_at: string
  claimed_at: string | null
  revoked_at: string | null
}

type TelemetryRow = {
  created_at: string
  event_type: string
  gym_id: string | null
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

function bucketByDay(rows: Array<{ created_at: string }>, labels: string[]): number[] {
  const index = new Map(labels.map((l, i) => [l, i]))
  const values = Array(labels.length).fill(0)
  for (const row of rows) {
    const key = utcDayKey(new Date(row.created_at))
    const idx = index.get(key)
    if (idx !== undefined) values[idx] += 1
  }
  return values
}

function bucketClaimedByDay(tokens: TokenRow[], labels: string[]): number[] {
  const index = new Map(labels.map((l, i) => [l, i]))
  const values = Array(labels.length).fill(0)
  for (const token of tokens) {
    if (!token.claimed_at) continue
    const key = utcDayKey(new Date(token.claimed_at))
    const idx = index.get(key)
    if (idx !== undefined) values[idx] += 1
  }
  return values
}

function pctRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function buildRedeemIndex(redeems: TelemetryRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const row of redeems) {
    if (row.event_type !== 'gym_claim_link_redeemed' || !row.gym_id) continue
    const list = map.get(row.gym_id) ?? []
    list.push(row.created_at)
    map.set(row.gym_id, list)
  }
  for (const [gymId, list] of map) {
    list.sort()
    map.set(gymId, list)
  }
  return map
}

function firstClickAfterToken(token: TokenRow, redeemIndex: Map<string, string[]>): string | null {
  const redeems = redeemIndex.get(token.gym_id) ?? []
  const tokenCreated = new Date(token.created_at).getTime()
  for (const at of redeems) {
    if (new Date(at).getTime() >= tokenCreated) return at
  }
  return null
}

function tokenWasClicked(token: TokenRow, redeemIndex: Map<string, string[]>): boolean {
  return firstClickAfterToken(token, redeemIndex) !== null
}

function funnelCounts(
  tokens: TokenRow[],
  redeemIndex: Map<string, string[]>,
): { issued: number; clicked: number; claimed: number } {
  let clicked = 0
  let claimed = 0
  for (const token of tokens) {
    if (tokenWasClicked(token, redeemIndex)) clicked += 1
    if (token.claimed_at) claimed += 1
  }
  return { issued: tokens.length, clicked, claimed }
}

function tokenStatus(
  token: TokenRow,
  redeemIndex: Map<string, string[]>,
  now: number,
): ClaimLinkActivityStatus {
  if (token.claimed_at) return 'claimed'
  if (token.revoked_at) return 'revoked'
  if (new Date(token.expires_at).getTime() <= now) return 'expired'
  if (tokenWasClicked(token, redeemIndex)) return 'opened'
  return 'awaiting_click'
}

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '28d': 28,
  '90d': 90,
}

export async function fetchClaimLinkAnalytics(
  supabase: SupabaseClient,
  range: AnalyticsRange,
): Promise<ClaimLinkAnalyticsPayload> {
  const dayCount = RANGE_DAYS[range]
  const now = new Date()
  const nowMs = now.getTime()
  const periodEnd = now
  const periodStart = addUtcDays(startOfUtcDay(now), -(dayCount - 1))
  const compareEnd = addUtcDays(periodStart, -1)
  const compareStart = addUtcDays(startOfUtcDay(compareEnd), -(dayCount - 1))

  const periodStartIso = periodStart.toISOString()
  const compareStartIso = compareStart.toISOString()
  const labels = buildDailyLabels(periodEnd, dayCount)

  const health = { tokens: true, telemetry: true }

  const telemetrySince = compareStartIso
  const telemetryRes = await supabase
    .from('owner_telemetry_events')
    .select('created_at, event_type, gym_id')
    .gte('created_at', telemetrySince)
    .in('event_type', ['gym_claim_link_redeemed', 'gym_claim_link_generated'])

  if (telemetryRes.error) {
    if (isMissingTableError(telemetryRes.error, 'owner_telemetry_events')) {
      health.telemetry = false
    } else {
      console.warn('[admin/analytics] claim telemetry', telemetryRes.error)
    }
  }

  const redeems = (telemetryRes.data ?? []).filter(
    (r) => (r as TelemetryRow).event_type === 'gym_claim_link_redeemed',
  ) as TelemetryRow[]
  const redeemIndex = buildRedeemIndex(redeems)

  const tokensRes = await supabase
    .from('gym_claim_tokens')
    .select('id, gym_id, created_at, expires_at, claimed_at, revoked_at')
    .gte('created_at', compareStartIso)
    .order('created_at', { ascending: false })

  if (tokensRes.error) {
    if (isMissingTableError(tokensRes.error, 'gym_claim_tokens')) {
      health.tokens = false
    } else {
      console.warn('[admin/analytics] claim tokens', tokensRes.error)
    }
  }

  const allTokens = (tokensRes.data ?? []) as TokenRow[]
  const currentTokens = allTokens.filter((t) => t.created_at >= periodStartIso)
  const previousTokens = allTokens.filter(
    (t) => t.created_at >= compareStartIso && t.created_at < periodStartIso,
  )

  const currentFunnel = funnelCounts(currentTokens, redeemIndex)
  const previousFunnel = funnelCounts(previousTokens, redeemIndex)

  const clickedEventsCurrent = redeems.filter((r) => r.created_at >= periodStartIso)

  const pipeline = {
    active: 0,
    openedAwaitingClaim: 0,
    expired: 0,
    revoked: 0,
  }

  const latestTokenByGym = new Map<string, TokenRow>()
  for (const token of allTokens) {
    if (!latestTokenByGym.has(token.gym_id)) {
      latestTokenByGym.set(token.gym_id, token)
    }
  }

  for (const token of latestTokenByGym.values()) {
    const status = tokenStatus(token, redeemIndex, nowMs)
    if (status === 'awaiting_click') pipeline.active += 1
    else if (status === 'opened') pipeline.openedAwaitingClaim += 1
    else if (status === 'expired') pipeline.expired += 1
    else if (status === 'revoked') pipeline.revoked += 1
  }

  const recentTokenCandidates = [...latestTokenByGym.values()]
    .filter((t) => !t.claimed_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)

  const gymIds = [...new Set(recentTokenCandidates.map((t) => t.gym_id))]
  const gymMeta = new Map<string, { name: string; city: string | null; country: string | null }>()
  if (gymIds.length > 0) {
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, name, city, country')
      .in('id', gymIds)
    for (const g of gyms ?? []) {
      gymMeta.set(g.id as string, {
        name: (g.name as string) || 'Untitled gym',
        city: (g.city as string | null) ?? null,
        country: (g.country as string | null) ?? null,
      })
    }
  }

  const recent: ClaimLinkActivityRow[] = recentTokenCandidates.map((token) => {
    const meta = gymMeta.get(token.gym_id)
    return {
      gym_id: token.gym_id,
      gym_name: meta?.name ?? 'Untitled gym',
      city: meta?.city ?? null,
      country: meta?.country ?? null,
      token_created_at: token.created_at,
      first_clicked_at: firstClickAfterToken(token, redeemIndex),
      claimed_at: token.claimed_at,
      expires_at: token.expires_at,
      status: tokenStatus(token, redeemIndex, nowMs),
    }
  })

  return {
    health,
    funnel: {
      issued: { current: currentFunnel.issued, previous: previousFunnel.issued },
      clicked: { current: currentFunnel.clicked, previous: previousFunnel.clicked },
      claimed: { current: currentFunnel.claimed, previous: previousFunnel.claimed },
      clickRate: {
        current: pctRate(currentFunnel.clicked, currentFunnel.issued),
        previous: pctRate(previousFunnel.clicked, previousFunnel.issued),
      },
      claimRate: {
        current: pctRate(currentFunnel.claimed, currentFunnel.issued),
        previous: pctRate(previousFunnel.claimed, previousFunnel.issued),
      },
      completionFromClick: {
        current: pctRate(currentFunnel.claimed, currentFunnel.clicked),
        previous: pctRate(previousFunnel.claimed, previousFunnel.clicked),
      },
    },
    daily: {
      labels,
      values: bucketByDay(currentTokens, labels),
      issued: bucketByDay(currentTokens, labels),
      clicked: bucketByDay(clickedEventsCurrent, labels),
      claimed: bucketClaimedByDay(
        allTokens.filter((t) => t.claimed_at && t.claimed_at >= periodStartIso),
        labels,
      ),
    },
    pipeline,
    recent,
  }
}
