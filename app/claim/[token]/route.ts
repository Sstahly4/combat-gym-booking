/**
 * GET /claim/<token>
 *
 * Public route. The user just clicks the link the admin sent them; we:
 *   1. Hash the token from the URL and look it up in gym_claim_tokens.
 *   2. Verify it's not claimed, revoked, or expired.
 *   3. Resolve the placeholder owner's email via Supabase auth admin.
 *   4. Generate a one-time magic link for that email and verify it server-side
 *      so the response sets the auth cookies for the placeholder user.
 *   5. Mark the token claimed_at = now() (single-use).
 *   6. Redirect to /manage?claimed=1 — the hard-prompt modal in the manage
 *      shell will then force them to set a real password.
 *
 * If anything fails we redirect to /claim/invalid?reason=... so the public
 * page can render a friendly "ask your admin to resend the link" message.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashClaimToken } from '@/lib/admin/gym-claim'
import {
  isClaimProduction,
  isClaimTokenPepperConfigured,
  CLAIM_TOKEN_PEPPER_HELP,
} from '@/lib/admin/gym-claim-env'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

interface Params { params: { token: string } }

function fail(request: NextRequest, reason: string) {
  const url = new URL('/claim/invalid', request.url)
  url.searchParams.set('reason', reason)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest, { params }: Params) {
  const plain = (params.token || '').trim()
  if (!plain) return fail(request, 'missing')

  if (isClaimProduction() && !isClaimTokenPepperConfigured()) {
    console.error('[claim] redeem blocked:', CLAIM_TOKEN_PEPPER_HELP)
    return fail(request, 'misconfigured')
  }

  const tokenHash = hashClaimToken(plain)
  const admin = createAdminClient()

  const { data: token, error: tokenErr } = await admin
    .from('gym_claim_tokens')
    .select('id, gym_id, expires_at, claimed_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (tokenErr || !token) return fail(request, 'not_found')
  if (token.claimed_at) return fail(request, 'used')
  if (token.revoked_at) return fail(request, 'revoked')
  if (new Date(token.expires_at).getTime() <= Date.now()) {
    return fail(request, 'expired')
  }

  const { data: gym, error: gymErr } = await admin
    .from('gyms')
    .select('id, owner_id, name')
    .eq('id', token.gym_id)
    .single()
  if (gymErr || !gym) return fail(request, 'gym_missing')

  const { data: ownerLookup, error: ownerErr } =
    await admin.auth.admin.getUserById(gym.owner_id)
  if (ownerErr || !ownerLookup?.user?.email) {
    return fail(request, 'owner_missing')
  }
  const ownerEmail = ownerLookup.user.email

  // Generate a one-time magic-link OTP for the placeholder user and consume it
  // server-side. verifyOtp on the route's supabase client sets cookies on the
  // outgoing response, which is exactly the session we want.
  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({ type: 'magiclink', email: ownerEmail })
  const tokenHashOtp = linkData?.properties?.hashed_token
  if (linkErr || !tokenHashOtp) return fail(request, 'link_failed')

  const supabase = await createClient()
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHashOtp,
  })
  if (verifyErr) {
    console.warn('[claim] verifyOtp failed', verifyErr)
    return fail(request, 'session_failed')
  }

  // Single-use: mark claimed only after the session is established.
  await admin
    .from('gym_claim_tokens')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', token.id)
    .is('claimed_at', null)

  await recordOwnerEvent(admin as never, {
    event_type: 'gym_claim_link_redeemed',
    user_id: gym.owner_id,
    gym_id: gym.id,
    metadata: { gym_name: gym.name },
  })

  // Land in manage with a flag so the hard-prompt modal opens immediately.
  const dest = new URL('/manage?claimed=1', request.url)
  return NextResponse.redirect(dest)
}
