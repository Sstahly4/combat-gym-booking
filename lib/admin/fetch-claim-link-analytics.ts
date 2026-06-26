import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnalyticsRange, DailySeries } from '@/lib/admin/fetch-admin-analytics'

/** Opens within this many seconds of issuance are flagged as likely admin smoke-tests. */
export const CLAIM_LINK_ADMIN_PREVIEW_SECONDS = 300

export type ClaimLinkActivityStatus =
  | 'awaiting_click'
  | 'opened'
  | 'claimed'
  | 'expired'
  | 'revoked'

export type ClaimLinkFunnelRow = {
  token_id: string
  gym_id: string
  gym_name: string
  city: string | null
  country: string | null
  sent_to: string | null
  issued_at: string
  opened_at: string | null
  claimed_at: string | null
  expires_at: string
  status: ClaimLinkActivityStatus
  likely_admin_preview: boolean
  issued_by_name: string | null
}

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
  likely_admin_preview: boolean
}

export type ClaimLinkAnalyticsPayload = {
  health: { tokens: boolean; telemetry: boolean }
  funnel: {
    issued: { current: number; previous: number }
    opened: { current: number; previous: number }
    openedExclPreview: { current: number; previous: number }
    claimed: { current: number; previous: number }
    openRate: { current: number; previous: number }
    ownerOpenRate: { current: number; previous: number }
    claimRate: { current: number; previous: number }
    completionFromOpen: { current: number; previous: number }
    likelyAdminPreviews: { current: number; previous: number }
  }
  daily: DailySeries & {
    issued: number[]
    opened: number[]
    claimed: number[]
  }
  pipeline: {
    active: number
    openedAwaitingClaim: number
    expired: number
    revoked: number
  }
  roster: ClaimLinkFunnelRow[]
  recent: ClaimLinkActivityRow[]
}

type TokenRow = {
  id: string
  gym_id: string
  created_at: string
  expires_at: string
  claimed_at: string | null
  revoked_at: string | null
  first_opened_at: string | null
  target_email: string | null
  created_by: string | null
}

type TelemetryRow = {
  created_at: string
  event_type: string
  gym_id: string | null
  metadata?: { token_id?: string; seconds_since_issue?: number } | null
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

function bucketByDay(rows: Array<{ at: string }>, labels: string[]): number[] {
  const index = new Map(labels.map((l, i) => [l, i]))
  const values = Array(labels.length).fill(0)
  for (const row of rows) {
    const key = utcDayKey(new Date(row.at))
    const idx = index.get(key)
    if (idx !== undefined) values[idx] += 1
  }
  return values
}

function pctRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function secondsBetween(earlier: string, later: string): number {
  return Math.max(0, (new Date(later).getTime() - new Date(earlier).getTime()) / 1000)
}

function isLikelyAdminPreview(token: TokenRow, openedAt: string | null): boolean {
  if (!openedAt) return false
  return secondsBetween(token.created_at, openedAt) <= CLAIM_LINK_ADMIN_PREVIEW_SECONDS
}

function buildTelemetryFallback(
  redeems: TelemetryRow[],
): { byTokenId: Map<string, string>; byGymAfter: Map<string, string[]> } {
  const byTokenId = new Map<string, string>()
  const byGymAfter = new Map<string, string[]>()
  for (const row of redeems) {
    if (row.event_type !== 'gym_claim_link_redeemed' || !row.gym_id) continue
    const tokenId = row.metadata?.token_id
    if (typeof tokenId === 'string' && tokenId && !byTokenId.has(tokenId)) {
      byTokenId.set(tokenId, row.created_at)
    }
    const list = byGymAfter.get(row.gym_id) ?? []
    list.push(row.created_at)
    byGymAfter.set(row.gym_id, list)
  }
  for (const [gymId, list] of byGymAfter) {
    list.sort()
    byGymAfter.set(gymId, list)
  }
  return { byTokenId, byGymAfter }
}

function resolveOpenedAt(
  token: TokenRow,
  fallback: { byTokenId: Map<string, string>; byGymAfter: Map<string, string[]> },
): string | null {
  if (token.first_opened_at) return token.first_opened_at
  const byId = fallback.byTokenId.get(token.id)
  if (byId) return byId
  const tokenCreated = new Date(token.created_at).getTime()
  const redeems = fallback.byGymAfter.get(token.gym_id) ?? []
  for (const at of redeems) {
    if (new Date(at).getTime() >= tokenCreated) return at
  }
  return null
}

function tokenStatus(
  token: TokenRow,
  openedAt: string | null,
  now: number,
): ClaimLinkActivityStatus {
  if (token.claimed_at) return 'claimed'
  if (token.revoked_at) return 'revoked'
  if (new Date(token.expires_at).getTime() <= now) return 'expired'
  if (openedAt) return 'opened'
  return 'awaiting_click'
}

function funnelCounts(tokens: TokenRow[], openedAtFor: (t: TokenRow) => string | null) {
  let opened = 0
  let openedExclPreview = 0
  let claimed = 0
  let likelyAdminPreviews = 0
  for (const token of tokens) {
    const openedAt = openedAtFor(token)
    if (openedAt) {
      opened += 1
      const preview = isLikelyAdminPreview(token, openedAt)
      if (preview) likelyAdminPreviews += 1
      else openedExclPreview += 1
    }
    if (token.claimed_at) claimed += 1
  }
  return {
    issued: tokens.length,
    opened,
    openedExclPreview,
    claimed,
    likelyAdminPreviews,
  }
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
  const periodStart = addUtcDays(startOfUtcDay(now), -(dayCount - 1))
  const compareStart = addUtcDays(periodStart, -dayCount)

  const periodStartIso = periodStart.toISOString()
  const compareStartIso = compareStart.toISOString()
  const labels = buildDailyLabels(now, dayCount)

  const health = { tokens: true, telemetry: true }

  const telemetryRes = await supabase
    .from('owner_telemetry_events')
    .select('created_at, event_type, gym_id, metadata')
    .gte('created_at', compareStartIso)
    .eq('event_type', 'gym_claim_link_redeemed')

  if (telemetryRes.error) {
    if (isMissingTableError(telemetryRes.error, 'owner_telemetry_events')) {
      health.telemetry = false
    } else {
      console.warn('[admin/analytics] claim telemetry', telemetryRes.error)
    }
  }

  const telemetryFallback = buildTelemetryFallback((telemetryRes.data ?? []) as TelemetryRow[])
  const openedAtFor = (token: TokenRow) => resolveOpenedAt(token, telemetryFallback)

  const tokensRes = await supabase
    .from('gym_claim_tokens')
    .select(
      'id, gym_id, created_at, expires_at, claimed_at, revoked_at, first_opened_at, target_email, created_by',
    )
    .gte('created_at', compareStartIso)
    .order('created_at', { ascending: false })

  if (tokensRes.error) {
    if (isMissingTableError(tokensRes.error, 'gym_claim_tokens')) {
      health.tokens = false
    } else {
      console.warn('[admin/analytics] claim tokens', tokensRes.error)
    }
  }

  const cohortTokens = (tokensRes.data ?? []) as TokenRow[]
  const currentTokens = cohortTokens.filter((t) => t.created_at >= periodStartIso)
  const previousTokens = cohortTokens.filter(
    (t) => t.created_at >= compareStartIso && t.created_at < periodStartIso,
  )

  const currentFunnel = funnelCounts(currentTokens, openedAtFor)
  const previousFunnel = funnelCounts(previousTokens, openedAtFor)

  const pipelineTokensRes = await supabase
    .from('gym_claim_tokens')
    .select(
      'id, gym_id, created_at, expires_at, claimed_at, revoked_at, first_opened_at, target_email, created_by',
    )
    .is('claimed_at', null)
    .order('created_at', { ascending: false })

  const pipelineTokens = (pipelineTokensRes.error ? [] : pipelineTokensRes.data ?? []) as TokenRow[]
  const latestOutstandingByGym = new Map<string, TokenRow>()
  for (const token of pipelineTokens) {
    if (!latestOutstandingByGym.has(token.gym_id)) {
      latestOutstandingByGym.set(token.gym_id, token)
    }
  }

  const pipeline = {
    active: 0,
    openedAwaitingClaim: 0,
    expired: 0,
    revoked: 0,
  }

  for (const token of latestOutstandingByGym.values()) {
    const openedAt = openedAtFor(token)
    const status = tokenStatus(token, openedAt, nowMs)
    if (status === 'awaiting_click') pipeline.active += 1
    else if (status === 'opened') pipeline.openedAwaitingClaim += 1
    else if (status === 'expired') pipeline.expired += 1
    else if (status === 'revoked') pipeline.revoked += 1
  }

  const rosterTokens = [...currentTokens].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const gymIds = [...new Set(rosterTokens.map((t) => t.gym_id))]
  const adminIds = [
    ...new Set(rosterTokens.map((t) => t.created_by).filter(Boolean)),
  ] as string[]

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

  const adminMeta = new Map<string, string>()
  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', adminIds)
    for (const p of admins ?? []) {
      adminMeta.set(p.id as string, (p.full_name as string | null)?.trim() || 'Admin')
    }
  }

  const roster: ClaimLinkFunnelRow[] = rosterTokens.map((token) => {
    const meta = gymMeta.get(token.gym_id)
    const openedAt = openedAtFor(token)
    return {
      token_id: token.id,
      gym_id: token.gym_id,
      gym_name: meta?.name ?? 'Untitled gym',
      city: meta?.city ?? null,
      country: meta?.country ?? null,
      sent_to: token.target_email,
      issued_at: token.created_at,
      opened_at: openedAt,
      claimed_at: token.claimed_at,
      expires_at: token.expires_at,
      status: tokenStatus(token, openedAt, nowMs),
      likely_admin_preview: isLikelyAdminPreview(token, openedAt),
      issued_by_name: token.created_by ? adminMeta.get(token.created_by) ?? null : null,
    }
  })

  const recentCandidates = [...latestOutstandingByGym.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)

  const recentGymIds = [...new Set(recentCandidates.map((t) => t.gym_id))]
  if (recentGymIds.some((id) => !gymMeta.has(id))) {
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, name, city, country')
      .in('id', recentGymIds)
    for (const g of gyms ?? []) {
      gymMeta.set(g.id as string, {
        name: (g.name as string) || 'Untitled gym',
        city: (g.city as string | null) ?? null,
        country: (g.country as string | null) ?? null,
      })
    }
  }

  const recent: ClaimLinkActivityRow[] = recentCandidates.map((token) => {
    const meta = gymMeta.get(token.gym_id)
    const openedAt = openedAtFor(token)
    return {
      gym_id: token.gym_id,
      gym_name: meta?.name ?? 'Untitled gym',
      city: meta?.city ?? null,
      country: meta?.country ?? null,
      token_created_at: token.created_at,
      first_clicked_at: openedAt,
      claimed_at: token.claimed_at,
      expires_at: token.expires_at,
      status: tokenStatus(token, openedAt, nowMs),
      likely_admin_preview: isLikelyAdminPreview(token, openedAt),
    }
  })

  const dailyOpened = currentTokens
    .map((token) => {
      const at = openedAtFor(token)
      return at ? { at } : null
    })
    .filter(Boolean) as Array<{ at: string }>

  return {
    health,
    funnel: {
      issued: { current: currentFunnel.issued, previous: previousFunnel.issued },
      opened: { current: currentFunnel.opened, previous: previousFunnel.opened },
      openedExclPreview: {
        current: currentFunnel.openedExclPreview,
        previous: previousFunnel.openedExclPreview,
      },
      claimed: { current: currentFunnel.claimed, previous: previousFunnel.claimed },
      openRate: {
        current: pctRate(currentFunnel.opened, currentFunnel.issued),
        previous: pctRate(previousFunnel.opened, previousFunnel.issued),
      },
      ownerOpenRate: {
        current: pctRate(currentFunnel.openedExclPreview, currentFunnel.issued),
        previous: pctRate(previousFunnel.openedExclPreview, previousFunnel.issued),
      },
      claimRate: {
        current: pctRate(currentFunnel.claimed, currentFunnel.issued),
        previous: pctRate(previousFunnel.claimed, previousFunnel.issued),
      },
      completionFromOpen: {
        current: pctRate(currentFunnel.claimed, currentFunnel.openedExclPreview),
        previous: pctRate(previousFunnel.claimed, previousFunnel.openedExclPreview),
      },
      likelyAdminPreviews: {
        current: currentFunnel.likelyAdminPreviews,
        previous: previousFunnel.likelyAdminPreviews,
      },
    },
    daily: {
      labels,
      values: bucketByDay(currentTokens.map((t) => ({ at: t.created_at })), labels),
      issued: bucketByDay(currentTokens.map((t) => ({ at: t.created_at })), labels),
      opened: bucketByDay(dailyOpened, labels),
      claimed: bucketByDay(
        currentTokens
          .filter((t) => t.claimed_at)
          .map((t) => ({ at: t.claimed_at as string })),
        labels,
      ),
    },
    pipeline,
    roster,
    recent,
  }
}
