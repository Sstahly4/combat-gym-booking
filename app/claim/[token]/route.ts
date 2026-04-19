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
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashClaimToken } from '@/lib/admin/gym-claim'
import {
  isClaimProduction,
  isClaimTokenPepperConfigured,
  CLAIM_TOKEN_PEPPER_HELP,
} from '@/lib/admin/gym-claim-env'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

interface Params { params: { token: string } }

/**
 * Admin `generateLink()` returns the OTP hash either as `properties.hashed_token`
 * directly or only inside `action_link` query params (older / newer GoTrue
 * versions differ). Pull whichever is available so server-side `verifyOtp`
 * always has a token to verify.
 */
function extractOtpHash(
  linkData: { properties?: Record<string, unknown> | null } | null | undefined,
): string | null {
  const p = linkData?.properties
  if (!p) return null
  const direct = p.hashed_token
  if (typeof direct === 'string' && direct.length > 0) return direct
  const actionLink = p.action_link
  if (typeof actionLink === 'string' && actionLink.length > 0) {
    try {
      const u = new URL(actionLink)
      const th = u.searchParams.get('token_hash') || u.searchParams.get('token')
      if (th) return th
    } catch {
      /* ignore */
    }
  }
  return null
}

function fail(request: NextRequest, reason: string, detail?: unknown) {
  console.warn('[claim] redirect to /claim/invalid', { reason, detail })
  const url = new URL('/claim/invalid', request.url)
  url.searchParams.set('reason', reason)
  return NextResponse.redirect(url)
}

/**
 * Supabase splits its auth payload into chunked cookies (sb-<ref>-auth-token,
 * sb-<ref>-auth-token.0, .1, .code-verifier, etc). Clear them all so a previous
 * session from the same browser (admin or a previously-claimed placeholder)
 * cannot survive into the new claim session.
 */
function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith('sb-')) {
      response.cookies.set({
        name: c.name,
        value: '',
        path: '/',
        maxAge: 0,
      })
    }
  }
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

  if (tokenErr || !token) return fail(request, 'not_found', tokenErr?.message)
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
  if (gymErr || !gym) return fail(request, 'gym_missing', gymErr?.message)

  const { data: ownerLookup, error: ownerErr } =
    await admin.auth.admin.getUserById(gym.owner_id)
  if (ownerErr || !ownerLookup?.user?.email) {
    return fail(request, 'owner_missing', ownerErr?.message ?? 'no email on placeholder user')
  }
  const ownerEmail = ownerLookup.user.email
  console.info('[claim] redeeming token', {
    gym_id: gym.id,
    owner_id: gym.owner_id,
    owner_email_domain: ownerEmail.split('@')[1] ?? null,
  })

  // Build the redirect response first, then bind the Supabase browser client to it so
  // `verifyOtp` Set-Cookie headers are applied to this same response. Using
  // `cookies()` from `next/headers` + a bare `NextResponse.redirect()` drops the
  // session cookies in App Router route handlers — users see /claim/invalid?reason=session_failed.
  const dest = new URL('/manage?claimed=1', request.url)
  const redirectResponse = NextResponse.redirect(dest)

  // IMPORTANT: start with NO inbound cookies. If the visitor is already signed
  // in as someone else (e.g. the admin who issued the link, opening it in the
  // same browser), their session cookies would be sent in, GoTrue would see an
  // active session, and verifyOtp can fail or refuse to swap users. Treating
  // this request as anonymous lets verifyOtp cleanly mint the placeholder
  // session and overwrite the cookies on the redirect response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  clearSupabaseAuthCookies(request, redirectResponse)

  // Use a recovery-type link rather than magiclink. For users created with
  // `email_confirm: true` (every placeholder owner) GoTrue silently invalidates
  // magiclink hashed_tokens, surfacing as `otp_expired` from verifyOtp. Recovery
  // links are designed for already-confirmed users, sign them in just the same,
  // and fit this flow because the next thing we ask for is a new password.
  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({ type: 'recovery', email: ownerEmail })
  const tokenHashOtp = extractOtpHash(
    linkData as { properties?: Record<string, unknown> | null } | null,
  )
  if (linkErr || !tokenHashOtp) {
    return fail(request, 'link_failed', {
      message: linkErr?.message,
      hasProperties: Boolean(linkData?.properties),
      keys: linkData?.properties ? Object.keys(linkData.properties) : null,
    })
  }

  const { error: verifyErr, data: verifyData } = await supabase.auth.verifyOtp({
    type: 'recovery',
    token_hash: tokenHashOtp,
  })
  if (verifyErr || !verifyData?.session) {
    return fail(request, 'session_failed', {
      message: verifyErr?.message,
      status: (verifyErr as unknown as { status?: number })?.status,
      code: (verifyErr as unknown as { code?: string })?.code,
      hasSession: Boolean(verifyData?.session),
    })
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

  return redirectResponse
}
