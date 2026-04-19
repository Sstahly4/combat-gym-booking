/**
 * POST /api/manage/account/complete-claim
 *
 * Used by the in-dashboard hard prompt that fires after an owner redeems a
 * claim link. The placeholder account has a random admin-generated password
 * the user has never seen, so we deliberately do NOT require a current
 * password here — gating is "you are signed in AND your profile is still in
 * placeholder state". The moment they pick a password we flip
 * claim_password_set = true and the modal goes away.
 *
 * Optionally accepts a real email; if provided, we update the auth email via
 * service role (skipping the verification round-trip — they're already
 * authenticated through the signed claim link), and clear placeholder_account
 * + placeholder_email so soft prompts disappear too.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validatePasswordRules } from '@/lib/auth/password-rules'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, placeholder_account, claim_password_set, placeholder_email')
      .eq('id', user.id)
      .single()

    if (profErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only allow this endpoint while the account is mid-claim, so we don't
    // become a back-door for non-claim users to skip current-password.
    if (!profile.placeholder_account && profile.claim_password_set) {
      return NextResponse.json(
        { error: 'Claim already complete — use the regular password update.' },
        { status: 400 },
      )
    }

    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const newPassword = String(body?.new_password ?? '')
    const newEmailRaw = body?.new_email != null ? String(body.new_email).trim().toLowerCase() : ''
    const fullName = body?.full_name != null ? String(body.full_name).trim().slice(0, 120) : ''

    const validation = validatePasswordRules(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          code: 'PASSWORD_RULES_FAILED',
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    if (newEmailRaw && !isValidEmail(newEmailRaw)) {
      return NextResponse.json({ error: 'Email looks invalid' }, { status: 400 })
    }

    const admin = createAdminClient()

    const updates: { password: string; email?: string } = { password: newPassword }
    if (newEmailRaw && newEmailRaw !== user.email?.toLowerCase()) {
      updates.email = newEmailRaw
    }

    // Service role updates (the user is authenticated via the claim-link
    // session, so this is safe; we skip Supabase's email change confirmation
    // because they are first-time setting up an email here).
    const { error: authUpdErr } = await admin.auth.admin.updateUserById(user.id, {
      ...updates,
      email_confirm: updates.email ? true : undefined,
    })
    if (authUpdErr) {
      return NextResponse.json(
        { error: authUpdErr.message || 'Failed to update credentials' },
        { status: 400 },
      )
    }

    const profilePatch: Record<string, unknown> = {
      claim_password_set: true,
      updated_at: new Date().toISOString(),
    }
    if (updates.email) {
      profilePatch.placeholder_account = false
      profilePatch.placeholder_email = null
    }
    if (fullName) {
      profilePatch.full_name = fullName
    }

    const { error: profUpdErr } = await admin
      .from('profiles')
      .update(profilePatch)
      .eq('id', user.id)
    if (profUpdErr) {
      console.warn('[complete-claim] profile update failed', profUpdErr)
    }

    await admin.from('security_events').insert({
      user_id: user.id,
      event_type: 'password_changed',
      metadata: { via: 'claim_complete', email_changed: Boolean(updates.email) },
    })

    await recordOwnerEvent(admin as never, {
      event_type: 'gym_claim_password_set',
      user_id: user.id,
      metadata: { email_changed: Boolean(updates.email) },
    })
    if (updates.email) {
      await recordOwnerEvent(admin as never, {
        event_type: 'gym_claim_email_updated',
        user_id: user.id,
        metadata: {},
      })
    }

    return NextResponse.json({
      success: true,
      email: updates.email ?? user.email,
      claim_complete: Boolean(updates.email),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to complete claim' },
      { status: 500 },
    )
  }
}
