/**
 * Admin: mint a one-click Partner Hub login link for an existing gym owner.
 *
 * POST → returns { url, expires_at, owner_email, gym_name } once so you can
 * paste into WhatsApp / email. Plaintext is never stored; generate again any time.
 *
 * Unlike claim links, this does NOT create placeholder accounts — the gym must
 * already have a real (non-placeholder) owner.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { mintOwnerLoginLink } from '@/lib/auth/mint-owner-login-link'
import {
  isOwnerLoginProduction,
  isOwnerLoginTokenPepperConfigured,
  OWNER_LOGIN_TOKEN_DEFAULT_EXPIRY_DAYS,
  OWNER_LOGIN_TOKEN_PEPPER_HELP,
} from '@/lib/auth/owner-login-link'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'
import { isPlaceholderEmail } from '@/lib/admin/gym-claim'

interface Params {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (isOwnerLoginProduction() && !isOwnerLoginTokenPepperConfigured()) {
    console.error('[login-link] blocked:', OWNER_LOGIN_TOKEN_PEPPER_HELP)
    return NextResponse.json(
      {
        error: 'Owner login links are disabled: server is missing CLAIM_TOKEN_PEPPER (or OWNER_LOGIN_TOKEN_PEPPER).',
        code: 'OWNER_LOGIN_PEPPER_MISSING',
        help: OWNER_LOGIN_TOKEN_PEPPER_HELP,
      },
      { status: 503 },
    )
  }

  const gymId = params.id
  if (!gymId) {
    return NextResponse.json({ error: 'gym id is required' }, { status: 400 })
  }

  let body: { expires_in_days?: number; redirect_path?: string } = {}
  try {
    body = await request.json()
  } catch {
    /* empty body is fine */
  }

  const expiresInDays = Math.max(
    1,
    Math.min(60, Number(body.expires_in_days) || OWNER_LOGIN_TOKEN_DEFAULT_EXPIRY_DAYS),
  )
  const redirectPath =
    typeof body.redirect_path === 'string' && body.redirect_path.trim()
      ? body.redirect_path.trim()
      : '/manage/bookings'

  const admin = createAdminClient()

  const { data: gym, error: gymErr } = await admin
    .from('gyms')
    .select('id, owner_id, name')
    .eq('id', gymId)
    .single()
  if (gymErr || !gym) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, placeholder_account, full_name')
    .eq('id', gym.owner_id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'Gym has no owner profile' }, { status: 400 })
  }
  if (profile.role === 'admin') {
    return NextResponse.json(
      {
        error: 'This gym is still admin-owned. Issue a claim link first from Claim links.',
        code: 'USE_CLAIM_LINK',
      },
      { status: 400 },
    )
  }
  if (profile.role !== 'owner') {
    return NextResponse.json({ error: 'Gym owner is not an owner account' }, { status: 400 })
  }
  if (profile.placeholder_account) {
    return NextResponse.json(
      {
        error: 'This owner is still on a claim link. Send them the claim link until they finish setup.',
        code: 'USE_CLAIM_LINK',
      },
      { status: 400 },
    )
  }

  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(gym.owner_id)
  const ownerEmail = authUser?.user?.email ?? null
  if (authErr || !ownerEmail) {
    return NextResponse.json({ error: 'Could not resolve owner email' }, { status: 400 })
  }
  if (isPlaceholderEmail(ownerEmail)) {
    return NextResponse.json(
      {
        error: 'Owner still has a placeholder email. Finish claim setup (or update email) first.',
        code: 'USE_CLAIM_LINK',
      },
      { status: 400 },
    )
  }

  const minted = await mintOwnerLoginLink(admin, {
    userId: gym.owner_id,
    redirectPath,
    purpose: 'admin_manual',
    expiryDays: expiresInDays,
  })

  if (!minted) {
    return NextResponse.json(
      { error: 'Failed to mint login link. Check that owner_login_tokens migration is applied.' },
      { status: 500 },
    )
  }

  await recordOwnerEvent(admin as never, {
    event_type: 'owner_login_link_generated',
    user_id: gym.owner_id,
    gym_id: gym.id,
    metadata: {
      purpose: 'admin_manual',
      expires_at: minted.expiresAt,
      redirect_path: redirectPath,
      generated_by: auth.user.id,
    },
  })

  return NextResponse.json({
    url: minted.url,
    expires_at: minted.expiresAt,
    owner_email: ownerEmail,
    owner_name: profile.full_name ?? null,
    gym_name: gym.name,
    redirect_path: redirectPath,
  })
}
