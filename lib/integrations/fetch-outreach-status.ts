import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isStripeConnected,
  platformStageLabel,
  platformStageSheetStatus,
  resolvePlatformStage,
  type PlatformStage,
} from '@/lib/admin/platform-stage'

export type OutreachGymStatus = {
  gym_id: string
  gym_name: string
  platform_stage: PlatformStage
  platform_stage_label: string
  sheet_status: string
  token_id: string | null
  link_issued_at: string | null
  outreach_sent_at: string | null
  owner_first_opened_at: string | null
  first_opened_at: string | null
  first_opened_by: 'admin' | 'owner' | null
  password_set: boolean
  stripe_connected: boolean
  claim_url_active: boolean
  token_expires_at: string | null
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
}

type GymRow = {
  id: string
  name: string | null
  owner_id: string
  stripe_account_id: string | null
  stripe_connect_verified: boolean | null
}

export async function fetchOutreachStatusByGymIds(
  supabase: SupabaseClient,
  gymIds: string[],
): Promise<{ gyms: OutreachGymStatus[]; missing: string[] }> {
  if (gymIds.length === 0) return { gyms: [], missing: [] }

  const nowMs = Date.now()

  const { data: gyms, error: gymErr } = await supabase
    .from('gyms')
    .select('id, name, owner_id, stripe_account_id, stripe_connect_verified')
    .in('id', gymIds)

  if (gymErr) throw gymErr

  const gymById = new Map((gyms ?? []).map((g) => [g.id as string, g as GymRow]))
  const missing = gymIds.filter((id) => !gymById.has(id))
  const foundIds = [...gymById.keys()]

  if (foundIds.length === 0) return { gyms: [], missing: gymIds }

  const ownerIds = [...new Set([...gymById.values()].map((g) => g.owner_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, claim_password_set')
    .in('id', ownerIds)

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p as { claim_password_set: boolean | null }]),
  )

  const { data: tokens } = await supabase
    .from('gym_claim_tokens')
    .select(
      'id, gym_id, created_at, expires_at, claimed_at, revoked_at, first_opened_at, first_opened_by, owner_first_opened_at, outreach_sent_at',
    )
    .in('gym_id', foundIds)
    .order('created_at', { ascending: false })

  const latestTokenByGym = new Map<string, TokenRow>()
  for (const t of (tokens ?? []) as TokenRow[]) {
    if (!latestTokenByGym.has(t.gym_id)) latestTokenByGym.set(t.gym_id, t)
  }

  const gymsOut: OutreachGymStatus[] = foundIds.map((gymId) => {
    const gym = gymById.get(gymId)!
    const token = latestTokenByGym.get(gymId) ?? null
    const passwordSet = profileById.get(gym.owner_id)?.claim_password_set === true
    const stripeConnected = isStripeConnected(gym)
    const expired = token
      ? new Date(token.expires_at).getTime() <= nowMs
      : false
    const active = Boolean(
      token && !token.claimed_at && !token.revoked_at && !expired,
    )

    const stage = resolvePlatformStage({
      hasToken: Boolean(token),
      ownerOpenedAt: token?.owner_first_opened_at ?? null,
      outreachSentAt: token?.outreach_sent_at ?? null,
      passwordSet,
      stripeConnected,
      revokedAt: token?.revoked_at ?? null,
      expiresAt: token?.expires_at ?? null,
      nowMs,
    })

    return {
      gym_id: gymId,
      gym_name: gym.name?.trim() || 'Untitled gym',
      platform_stage: stage,
      platform_stage_label: platformStageLabel(stage),
      sheet_status: platformStageSheetStatus(stage),
      token_id: token?.id ?? null,
      link_issued_at: token?.created_at ?? null,
      outreach_sent_at: token?.outreach_sent_at ?? null,
      owner_first_opened_at: token?.owner_first_opened_at ?? null,
      first_opened_at: token?.first_opened_at ?? null,
      first_opened_by: token?.first_opened_by ?? null,
      password_set: passwordSet,
      stripe_connected: stripeConnected,
      claim_url_active: active,
      token_expires_at: token?.expires_at ?? null,
    }
  })

  return { gyms: gymsOut, missing }
}

export async function markOutreachSent(
  supabase: SupabaseClient,
  input: { gym_id: string; sent_at?: string; channel?: string },
): Promise<{ updated: boolean; outreach_sent_at: string | null }> {
  const sentAt = input.sent_at ?? new Date().toISOString()

  const { data: token } = await supabase
    .from('gym_claim_tokens')
    .select('id, outreach_sent_at, revoked_at, claimed_at, expires_at')
    .eq('gym_id', input.gym_id)
    .is('revoked_at', null)
    .is('claimed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!token?.id) {
    return { updated: false, outreach_sent_at: null }
  }

  if (token.outreach_sent_at) {
    return { updated: false, outreach_sent_at: token.outreach_sent_at as string }
  }

  const { error } = await supabase
    .from('gym_claim_tokens')
    .update({
      outreach_sent_at: sentAt,
    })
    .eq('id', token.id)
    .is('outreach_sent_at', null)

  if (error) throw error

  return { updated: true, outreach_sent_at: sentAt }
}
