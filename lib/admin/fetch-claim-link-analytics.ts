import type { SupabaseClient } from '@supabase/supabase-js'
import { isPlaceholderEmail } from '@/lib/admin/gym-claim'
import {
  claimLinkStageLabel,
  isStripeConnected,
  resolveClaimLinkStage,
  type ClaimLinkStage,
} from '@/lib/admin/claim-link-stage'
import type { AnalyticsRange } from '@/lib/admin/fetch-admin-analytics'

export type { ClaimLinkStage } from '@/lib/admin/claim-link-stage'

export type ClaimLinkRosterRow = {
  token_id: string
  gym_id: string
  gym_name: string
  city: string | null
  country: string | null
  sent_to: string | null
  sent_to_is_placeholder: boolean
  issued_at: string
  opened_at: string | null
  opened_by: 'admin' | 'owner' | null
  claimed_at: string | null
  expires_at: string
  stage: ClaimLinkStage
  stage_label: string
  password_set: boolean
  stripe_connected: boolean
  issued_by_name: string | null
}

export type ClaimLinkAnalyticsPayload = {
  health: { tokens: boolean }
  summary: {
    total: number
    /** Active links not opened yet (excludes expired/revoked). */
    notClicked: number
    clickedNotComplete: number
    passwordAdded: number
    onboarded: number
    expired: number
    revoked: number
    ownerClicks: number
    adminClicks: number
    /** Owner (or unknown) opens ÷ links issued — excludes admin smoke-tests. */
    clickRate: number
    /** Fully onboarded (password + Stripe) ÷ links issued. */
    claimRate: number
  }
  roster: ClaimLinkRosterRow[]
}

type TokenRow = {
  id: string
  gym_id: string
  created_at: string
  expires_at: string
  claimed_at: string | null
  revoked_at: string | null
  first_opened_at: string | null
  first_opened_by: 'admin' | 'owner' | null
  target_email: string | null
  created_by: string | null
}

type GymRow = {
  id: string
  name: string | null
  city: string | null
  country: string | null
  owner_id: string
  stripe_account_id: string | null
  stripe_connect_verified: boolean | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  claim_password_set: boolean | null
  placeholder_email: string | null
}

type TelemetryRow = {
  created_at: string
  gym_id: string | null
  metadata?: { token_id?: string } | null
}

function isMissingTableError(error: unknown, table: string): boolean {
  const e = error as { code?: string; message?: string }
  if (e?.code === 'PGRST205') return true
  const msg = typeof e?.message === 'string' ? e.message : ''
  return /Could not find the table/i.test(msg) && msg.includes(table)
}

function pctRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function inferOpenedBy(token: TokenRow, openedAt: string | null): 'admin' | 'owner' | null {
  if (!openedAt) return null
  if (token.first_opened_by === 'admin' || token.first_opened_by === 'owner') {
    return token.first_opened_by
  }
  return null
}

function buildTelemetryFallback(redeems: TelemetryRow[]): {
  byTokenId: Map<string, string>
  byGymAfter: Map<string, string[]>
} {
  const byTokenId = new Map<string, string>()
  const byGymAfter = new Map<string, string[]>()
  for (const row of redeems) {
    if (!row.gym_id) continue
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
  for (const at of fallback.byGymAfter.get(token.gym_id) ?? []) {
    if (new Date(at).getTime() >= tokenCreated) return at
  }
  return null
}

const EMPTY_SUMMARY: ClaimLinkAnalyticsPayload['summary'] = {
  total: 0,
  notClicked: 0,
  clickedNotComplete: 0,
  passwordAdded: 0,
  onboarded: 0,
  expired: 0,
  revoked: 0,
  ownerClicks: 0,
  adminClicks: 0,
  clickRate: 0,
  claimRate: 0,
}

/** Full claim-link history for Insights — not filtered by date range (range is ignored). */
export async function fetchClaimLinkAnalytics(
  supabase: SupabaseClient,
  _range?: AnalyticsRange,
): Promise<ClaimLinkAnalyticsPayload> {
  const nowMs = Date.now()
  const health = { tokens: true }

  const tokensRes = await supabase
    .from('gym_claim_tokens')
    .select(
      'id, gym_id, created_at, expires_at, claimed_at, revoked_at, first_opened_at, first_opened_by, target_email, created_by',
    )
    .order('created_at', { ascending: false })
    .limit(500)

  if (tokensRes.error) {
    if (isMissingTableError(tokensRes.error, 'gym_claim_tokens')) {
      health.tokens = false
    } else {
      console.warn('[admin/analytics] claim tokens', tokensRes.error)
    }
    return { health, summary: EMPTY_SUMMARY, roster: [] }
  }

  const tokens = (tokensRes.data ?? []) as TokenRow[]
  const gymIds = [...new Set(tokens.map((t) => t.gym_id))]

  const telemetryRes = gymIds.length
    ? await supabase
        .from('owner_telemetry_events')
        .select('created_at, gym_id, metadata')
        .in('gym_id', gymIds)
        .eq('event_type', 'gym_claim_link_redeemed')
        .order('created_at', { ascending: true })
    : { data: [] as TelemetryRow[] }

  const telemetryFallback = buildTelemetryFallback((telemetryRes.data ?? []) as TelemetryRow[])
  const openedAtFor = (token: TokenRow) => resolveOpenedAt(token, telemetryFallback)

  const gymById = new Map<string, GymRow>()
  if (gymIds.length > 0) {
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, name, city, country, owner_id, stripe_account_id, stripe_connect_verified')
      .in('id', gymIds)
    for (const g of gyms ?? []) {
      gymById.set(g.id as string, g as GymRow)
    }
  }

  const ownerIds = [...new Set([...gymById.values()].map((g) => g.owner_id))]
  const adminIds = [...new Set(tokens.map((t) => t.created_by).filter(Boolean))] as string[]
  const profileIds = [...new Set([...ownerIds, ...adminIds])]

  const profileById = new Map<string, ProfileRow>()
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, claim_password_set, placeholder_email')
      .in('id', profileIds)
    for (const p of profiles ?? []) {
      profileById.set(p.id as string, p as ProfileRow)
    }
  }

  const roster: ClaimLinkRosterRow[] = tokens.map((token) => {
    const gym = gymById.get(token.gym_id)
    const owner = gym ? profileById.get(gym.owner_id) : undefined
    const openedAt = openedAtFor(token)
    const passwordSet = owner?.claim_password_set === true
    const stripeConnected = gym ? isStripeConnected(gym) : false
    const stage = resolveClaimLinkStage({
      openedAt,
      passwordSet,
      stripeConnected,
      revokedAt: token.revoked_at,
      expiresAt: token.expires_at,
      nowMs,
    })
    const sentTo = token.target_email ?? owner?.placeholder_email ?? null
    const sentToIsPlaceholder = sentTo ? isPlaceholderEmail(sentTo) : false

    return {
      token_id: token.id,
      gym_id: token.gym_id,
      gym_name: gym?.name?.trim() || 'Untitled gym',
      city: gym?.city ?? null,
      country: gym?.country ?? null,
      sent_to: sentTo,
      sent_to_is_placeholder: sentToIsPlaceholder,
      issued_at: token.created_at,
      opened_at: openedAt,
      opened_by: inferOpenedBy(token, openedAt),
      claimed_at: token.claimed_at,
      expires_at: token.expires_at,
      stage,
      stage_label: claimLinkStageLabel(stage),
      password_set: passwordSet,
      stripe_connected: stripeConnected,
      issued_by_name: token.created_by
        ? profileById.get(token.created_by)?.full_name?.trim() || 'Admin'
        : null,
    }
  })

  const summary = { ...EMPTY_SUMMARY, total: roster.length }

  for (const row of roster) {
    switch (row.stage) {
      case 'link_sent':
        summary.notClicked += 1
        break
      case 'clicked_not_complete':
        summary.clickedNotComplete += 1
        break
      case 'password_added':
        summary.passwordAdded += 1
        break
      case 'onboarded':
        summary.onboarded += 1
        break
      case 'expired':
        summary.expired += 1
        break
      case 'revoked':
        summary.revoked += 1
        break
    }
    if (row.opened_at) {
      if (row.opened_by === 'admin') summary.adminClicks += 1
      else summary.ownerClicks += 1
    }
  }

  summary.clickRate = pctRate(summary.ownerClicks, summary.total)
  summary.claimRate = pctRate(summary.onboarded, summary.total)

  return { health, summary, roster }
}
