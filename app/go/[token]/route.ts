/**
 * GET /go/<token>
 *
 * Short OTA-style owner login link. Owner taps the URL from WhatsApp/email; we:
 *   1. Hash the token and look it up in owner_login_tokens.
 *   2. Verify it's not revoked or expired (multi-use until expiry).
 *   3. Confirm the profile is still an owner.
 *   4. Sign them in via recovery OTP (server-side cookie set).
 *   5. Redirect to Partner Hub (usually /manage/bookings).
 *
 * Failures → /go/invalid?reason=…
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractOtpHash } from '@/lib/auth/extract-otp-hash'
import {
  hashOwnerLoginToken,
  isOwnerLoginProduction,
  isOwnerLoginTokenPepperConfigured,
  OWNER_LOGIN_TOKEN_PEPPER_HELP,
  withOwnerLoginHydrationFlag,
} from '@/lib/auth/owner-login-link'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

interface Params {
  params: { token: string }
}

function fail(request: NextRequest, reason: string, detail?: unknown) {
  console.warn('[go] redirect to /go/invalid', { reason, detail })
  const url = new URL('/go/invalid', request.url)
  url.searchParams.set('reason', reason)
  return NextResponse.redirect(url)
}

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

  if (isOwnerLoginProduction() && !isOwnerLoginTokenPepperConfigured()) {
    console.error('[go] redeem blocked:', OWNER_LOGIN_TOKEN_PEPPER_HELP)
    return fail(request, 'misconfigured')
  }

  const tokenHash = hashOwnerLoginToken(plain)
  const admin = createAdminClient()

  const { data: token, error: tokenErr } = await admin
    .from('owner_login_tokens')
    .select('id, user_id, redirect_path, booking_id, purpose, expires_at, revoked_at, first_used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (tokenErr || !token) {
    return fail(request, 'not_found', { message: tokenErr?.message })
  }

  if (token.revoked_at) return fail(request, 'revoked')
  if (new Date(token.expires_at).getTime() <= Date.now()) return fail(request, 'expired')

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id, role, placeholder_account')
    .eq('id', token.user_id)
    .maybeSingle()

  if (profileErr || !profile) {
    return fail(request, 'owner_missing', { message: profileErr?.message })
  }
  if (profile.role !== 'owner') {
    return fail(request, 'not_owner')
  }
  if (profile.placeholder_account) {
    return fail(request, 'use_claim_link')
  }

  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(token.user_id)
  const ownerEmail = authUser?.user?.email
  if (authErr || !ownerEmail) {
    return fail(request, 'owner_missing', { message: authErr?.message })
  }

  const redirectPath = withOwnerLoginHydrationFlag(token.redirect_path)
  const redirectResponse = NextResponse.redirect(new URL(redirectPath, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
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

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: ownerEmail,
  })
  const tokenHashOtp = extractOtpHash(
    linkData as { properties?: Record<string, unknown> | null } | null,
  )
  if (linkErr || !tokenHashOtp) {
    return fail(request, 'link_failed', {
      message: linkErr?.message,
      hasProperties: Boolean(linkData?.properties),
    })
  }

  const { error: verifyErr, data: verifyData } = await supabase.auth.verifyOtp({
    type: 'recovery',
    token_hash: tokenHashOtp,
  })
  if (verifyErr || !verifyData?.session) {
    return fail(request, 'session_failed', {
      message: verifyErr?.message,
      hasSession: Boolean(verifyData?.session),
    })
  }

  const nowIso = new Date().toISOString()
  if (!token.first_used_at) {
    await admin
      .from('owner_login_tokens')
      .update({ first_used_at: nowIso })
      .eq('id', token.id)
      .is('first_used_at', null)
  }

  await recordOwnerEvent(admin as never, {
    event_type: 'owner_login_link_redeemed',
    user_id: token.user_id,
    gym_id: null,
    metadata: {
      token_id: token.id,
      purpose: token.purpose,
      booking_id: token.booking_id,
      redirect_path: redirectPath,
    },
  })

  return redirectResponse
}
