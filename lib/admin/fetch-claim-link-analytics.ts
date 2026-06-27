import type { SupabaseClient } from '@supabase/supabase-js'
import { isPlaceholderEmail } from '@/lib/admin/gym-claim'
import {
  platformStageSheetStatus,
  isStripeConnected,
  resolvePlatformStage,
  type PlatformStage,
} from '@/lib/admin/platform-stage'
import type { AnalyticsRange } from '@/lib/admin/fetch-admin-analytics'

export type { PlatformStage } from '@/lib/admin/platform-stage'

export type ClaimLinkRosterRow = {
  token_id: string
  gym_id: string
  gym_name: string
  city: string | null
  country: string | null
  sent_to: string | null
  sent_to_is_placeholder: boolean
  issued_at: string
  /** Owner click only — not admin smoke-tests. */
  owner_opened_at: string | null
  first_opened_at: string | null
  first_opened_by: 'admin' | 'owner' | null
  outreach_sent_at: string | null
  claimed_at: string | null
  expires_at: string
  stage: PlatformStage
  stage_label: string
  /** Active token: not claimed, not revoked, not expired. */
  claim_url_active: boolean
  password_set: boolean
  stripe_connected: boolean
  issued_by_name: string | null
}

export type ClaimLinkAnalyticsPayload = {
  health: { tokens: boolean }
  summary: {
    total: number
    linkReady: number
    linkSent: number
    clicked: number
    claimed: number
    onboarded: number
    expired: number
    revoked: number
    ownerClicks: number
    adminClicks: number
    /** Owner opens ÷ links issued (excludes expired/revoked from denominator). */
    clickRate: number
    /** Password set ÷ active links issued. */
    claimRate: number
    /** Stripe connected ÷ active links issued. */
    onboardedRate: number
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
  owner_first_opened_at: string | null
  outreach_sent_at: string | null
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

const EMPTY_SUMMARY: ClaimLinkAnalyticsPayload['summary'] = {
  total: 0,
  linkReady: 0,
  linkSent: 0,
  clicked: 0,
  claimed: 0,
  onboarded: 0,
  expired: 0,
  revoked: 0,
  ownerClicks: 0,
  adminClicks: 0,
  clickRate: 0,
  claimRate: 0,
  onboardedRate: 0,
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
      'id, gym_id, created_at, expires_at, claimed_at, revoked_at, first_opened_at, first_opened_by, owner_first_opened_at, outreach_sent_at, target_email, created_by',
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
    const passwordSet = owner?.claim_password_set === true
    const stripeConnected = gym ? isStripeConnected(gym) : false
    const stage = resolvePlatformStage({
      hasToken: true,
      ownerOpenedAt: token.owner_first_opened_at,
      outreachSentAt: token.outreach_sent_at,
      passwordSet,
      stripeConnected,
      revokedAt: token.revoked_at,
      expiresAt: token.expires_at,
      nowMs,
    })
    const expired = new Date(token.expires_at).getTime() <= nowMs
    const claimUrlActive =
      !token.claimed_at && !token.revoked_at && !expired
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
      owner_opened_at: token.owner_first_opened_at,
      first_opened_at: token.first_opened_at,
      first_opened_by: token.first_opened_by,
      outreach_sent_at: token.outreach_sent_at,
      claimed_at: token.claimed_at,
      expires_at: token.expires_at,
      stage,
      stage_label: platformStageSheetStatus(stage),
      claim_url_active: claimUrlActive,
      password_set: passwordSet,
      stripe_connected: stripeConnected,
      issued_by_name: token.created_by
        ? profileById.get(token.created_by)?.full_name?.trim() || 'Admin'
        : null,
    }
  })

  const summary = { ...EMPTY_SUMMARY, total: roster.length }
  let rateDenominator = 0

  for (const row of roster) {
    switch (row.stage) {
      case 'link_ready':
        summary.linkReady += 1
        rateDenominator += 1
        break
      case 'link_sent':
        summary.linkSent += 1
        rateDenominator += 1
        break
      case 'clicked':
        summary.clicked += 1
        rateDenominator += 1
        break
      case 'claimed':
        summary.claimed += 1
        rateDenominator += 1
        break
      case 'onboarded':
        summary.onboarded += 1
        rateDenominator += 1
        break
      case 'expired':
        summary.expired += 1
        break
      case 'revoked':
        summary.revoked += 1
        break
      case 'no_link':
        break
    }
    if (row.owner_opened_at) summary.ownerClicks += 1
    if (row.first_opened_at && row.first_opened_by === 'admin') summary.adminClicks += 1
  }

  const denom = rateDenominator > 0 ? rateDenominator : summary.total
  summary.clickRate = pctRate(summary.ownerClicks, denom)
  summary.claimRate = pctRate(summary.claimed + summary.onboarded, denom)
  summary.onboardedRate = pctRate(summary.onboarded, denom)

  return { health, summary, roster }
}
