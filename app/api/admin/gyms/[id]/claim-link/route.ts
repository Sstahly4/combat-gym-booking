/**
 * Admin: generate / regenerate / revoke a claim link for a gym.
 *
 * - POST   → generate (or regenerate). Always revokes any prior active token
 *           for this gym, so admins never "lose" an orphan account: re-issuing
 *           is the recovery story.
 * - DELETE → revoke any active token without issuing a new one.
 *
 * On first generation, if the gym is currently owned by an admin (i.e. it's a
 * platform-pre-listed gym, not yet claimed), we create a synthetic Supabase
 * auth user, mark the profile placeholder, and reassign gyms.owner_id to the
 * new placeholder. Subsequent generations just rotate the token.
 *
 * The plaintext token is returned to the admin ONCE (not stored anywhere).
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import {
  generateClaimTokenPlain,
  hashClaimToken,
  buildClaimUrl,
  buildPlaceholderEmail,
  generatePlaceholderPassword,
  expiryDaysFromNowIso,
  CLAIM_TOKEN_DEFAULT_EXPIRY_DAYS,
  isPlaceholderEmail,
} from '@/lib/admin/gym-claim'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'
import {
  isClaimProduction,
  isClaimTokenPepperConfigured,
  CLAIM_TOKEN_PEPPER_HELP,
} from '@/lib/admin/gym-claim-env'

interface Params { params: { id: string } }

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (isClaimProduction() && !isClaimTokenPepperConfigured()) {
    console.error('[claim-link] blocked:', CLAIM_TOKEN_PEPPER_HELP)
    return NextResponse.json(
      {
        error: 'Gym claim links are disabled: server is missing CLAIM_TOKEN_PEPPER.',
        code: 'CLAIM_PEPPER_MISSING',
        help: CLAIM_TOKEN_PEPPER_HELP,
      },
      { status: 503 }
    )
  }

  const gymId = params.id
  if (!gymId) {
    return NextResponse.json({ error: 'gym id is required' }, { status: 400 })
  }

  let body: { expires_in_days?: number; target_email?: string | null } = {}
  try { body = await request.json() } catch { /* empty body is fine */ }
  const expiresInDays = Math.max(
    1,
    Math.min(60, Number(body.expires_in_days) || CLAIM_TOKEN_DEFAULT_EXPIRY_DAYS),
  )
  const targetEmail = (body.target_email ?? '').trim().toLowerCase() || null

  const admin = createAdminClient()

  // Load the gym + current owner.
  const { data: gym, error: gymErr } = await admin
    .from('gyms')
    .select('id, owner_id, name')
    .eq('id', gymId)
    .single()
  if (gymErr || !gym) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
  }

  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('id, role, placeholder_account, claim_password_set, placeholder_email')
    .eq('id', gym.owner_id)
    .maybeSingle()

  // Decide whether we need to mint a synthetic placeholder owner.
  // Trigger: current owner is the admin (role='admin') OR has no placeholder
  // flag set yet for a fresh gym. We only swap once — after that the gym is
  // already owned by a placeholder we can keep reusing.
  let placeholderUserId = gym.owner_id
  let placeholderEmail = ownerProfile?.placeholder_email ?? null

  const needsPlaceholder = !ownerProfile?.placeholder_account
  if (needsPlaceholder) {
    const email = (targetEmail || buildPlaceholderEmail(gym.id)).toLowerCase()
    const password = generatePlaceholderPassword()

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        placeholder_for_gym_id: gym.id,
        created_by_admin_id: auth.user.id,
      },
    })
    if (createErr || !created?.user) {
      return NextResponse.json(
        { error: createErr?.message || 'Failed to create placeholder account' },
        { status: 500 },
      )
    }
    placeholderUserId = created.user.id
    placeholderEmail = email

    // Insert / upsert profile row for the new auth user. The DB has a
    // handle_new_user trigger in most setups; we still upsert defensively.
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert(
        {
          id: placeholderUserId,
          role: 'owner',
          placeholder_account: true,
          claim_password_set: false,
          placeholder_email: email,
          full_name: gym.name ? `${gym.name} (owner)` : null,
        },
        { onConflict: 'id' },
      )
    if (profileErr) {
      return NextResponse.json(
        { error: `Failed to seed placeholder profile: ${profileErr.message}` },
        { status: 500 },
      )
    }

    // Reassign the gym to the placeholder.
    const { error: gymUpdErr } = await admin
      .from('gyms')
      .update({ owner_id: placeholderUserId })
      .eq('id', gym.id)
    if (gymUpdErr) {
      return NextResponse.json(
        { error: `Failed to reassign gym owner: ${gymUpdErr.message}` },
        { status: 500 },
      )
    }
  }

  // Revoke any active prior tokens for this gym.
  const nowIso = new Date().toISOString()
  await admin
    .from('gym_claim_tokens')
    .update({ revoked_at: nowIso })
    .eq('gym_id', gym.id)
    .is('claimed_at', null)
    .is('revoked_at', null)

  // Mint new token.
  const plain = generateClaimTokenPlain()
  const tokenHash = hashClaimToken(plain)
  const expiresAt = expiryDaysFromNowIso(expiresInDays)

  const { error: insErr } = await admin.from('gym_claim_tokens').insert({
    gym_id: gym.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: auth.user.id,
  })
  if (insErr) {
    return NextResponse.json(
      { error: `Failed to create claim token: ${insErr.message}` },
      { status: 500 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const url = buildClaimUrl(appUrl, plain)

  // Best-effort telemetry. Use the admin client because this is a service action.
  await recordOwnerEvent(admin as never, {
    event_type: 'gym_claim_link_generated',
    user_id: auth.user.id,
    gym_id: gym.id,
    metadata: {
      regenerated: !needsPlaceholder,
      expires_in_days: expiresInDays,
      placeholder_created: needsPlaceholder,
    },
  })

  return NextResponse.json({
    success: true,
    url,
    expires_at: expiresAt,
    placeholder_user_id: placeholderUserId,
    placeholder_email: placeholderEmail,
    placeholder_email_is_synthetic: isPlaceholderEmail(placeholderEmail),
    regenerated: !needsPlaceholder,
  })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const gymId = params.id
  if (!gymId) {
    return NextResponse.json({ error: 'gym id is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  const { error, count } = await supabase
    .from('gym_claim_tokens')
    .update({ revoked_at: nowIso }, { count: 'exact' })
    .eq('gym_id', gymId)
    .is('claimed_at', null)
    .is('revoked_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await recordOwnerEvent(createAdminClient() as never, {
    event_type: 'gym_claim_link_revoked',
    user_id: auth.user.id,
    gym_id: gymId,
    metadata: { revoked_count: count ?? 0 },
  })

  return NextResponse.json({ success: true, revoked: count ?? 0 })
}
