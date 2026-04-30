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

    if (!newEmailRaw) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!isValidEmail(newEmailRaw)) {
      return NextResponse.json({ error: 'Email looks invalid' }, { status: 400 })
    }
    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const wantsEmailChange = !!newEmailRaw && newEmailRaw !== user.email?.toLowerCase()

    /**
     * We split password and email updates so a bad email (disposable domain,
     * already in use, validation reject) does not silently block the password
     * being saved. Password is the harder gate — set it first, then attempt
     * the email change if requested.
     */
    const { error: pwErr } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })
    if (pwErr) {
      console.warn('[complete-claim] password update failed', {
        user_id: user.id,
        message: pwErr.message,
      })
      return NextResponse.json(
        { error: pwErr.message || 'Could not save your new password' },
        { status: 400 },
      )
    }

    let emailChanged = false
    let emailWarning: string | null = null
    if (wantsEmailChange) {
      // Pre-check: does this email already belong to another auth user? Supabase
      // surfaces this as a generic "Error updating user" without a useful code,
      // and it's the most common reason for this failure during repeated tests.
      let preExistingUserId: string | null = null
      try {
        const { data: existing } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        })
        const match = (existing?.users ?? []).find(
          (u) => (u.email ?? '').toLowerCase() === newEmailRaw && u.id !== user.id,
        )
        if (match?.id) preExistingUserId = match.id
      } catch (lookupErr) {
        console.warn('[complete-claim] listUsers pre-check failed', lookupErr)
      }

      if (preExistingUserId) {
        emailWarning =
          'That email is already linked to another CombatStay account. Sign out and sign in with that account, or use a different inbox here.'
        console.warn('[complete-claim] email already in use', {
          user_id: user.id,
          existing_user_id: preExistingUserId,
        })
      } else {
        const { data: emailUpdData, error: emailErr } = await admin.auth.admin.updateUserById(
          user.id,
          {
            email: newEmailRaw,
            email_confirm: true,
          },
        )
        if (emailErr) {
          const raw = emailErr.message || 'Error updating user'
          const lower = raw.toLowerCase()
          // Safely extract any extra debug fields Supabase may attach.
          const errAny = emailErr as unknown as {
            status?: number
            code?: string
            name?: string
          }
          let friendly = raw
          if (lower.includes('already') && (lower.includes('regist') || lower.includes('exists'))) {
            friendly = 'That email is already used by another CombatStay account. Use a different inbox.'
          } else if (lower.includes('invalid') && lower.includes('email')) {
            friendly = 'That email address looks invalid. Try another inbox (some disposable / temporary email services are not accepted).'
          } else if (lower.includes('rate') && lower.includes('limit')) {
            friendly = 'Too many email-change attempts in a short window. Wait a minute and try again.'
          } else if (lower.includes('signup') && lower.includes('disabled')) {
            friendly = 'Email sign-ups are disabled in this environment. Contact support to enable email changes for owner accounts.'
          } else if (lower === 'error updating user') {
            friendly = 'We could not save that email right now. Check the Supabase auth logs for this user, or try a different inbox.'
          }
          console.warn('[complete-claim] email update failed', {
            user_id: user.id,
            attempted_email: newEmailRaw,
            message: raw,
            status: errAny.status,
            code: errAny.code,
            name: errAny.name,
          })
          emailWarning = friendly
        } else if (emailUpdData?.user?.email?.toLowerCase() === newEmailRaw) {
          emailChanged = true
        } else {
          // No error but Supabase did not actually swap the email (e.g. confirmation
          // pending). Treat as warning so the soft email banner stays.
          console.warn('[complete-claim] email update returned no error but email unchanged', {
            user_id: user.id,
            returned_email: emailUpdData?.user?.email ?? null,
          })
          emailWarning =
            'Your new email needs confirmation before it becomes your sign-in address. Check the inbox we sent the verification to.'
        }
      }
    }

    const profilePatch: Record<string, unknown> = {
      claim_password_set: true,
      password_meets_current_policy: true,
      /** Real owner has completed claim — always clear placeholder gate for the hard modal. */
      placeholder_account: false,
      /** First-run dashboard tour (pricing, listing, payouts) — claim flow only. */
      claim_dashboard_tour_pending: true,
      updated_at: new Date().toISOString(),
    }
    if (emailChanged) {
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
      metadata: { via: 'claim_complete', email_changed: emailChanged },
    })

    await recordOwnerEvent(admin as never, {
      event_type: 'gym_claim_password_set',
      user_id: user.id,
      metadata: { email_changed: emailChanged },
    })
    if (emailChanged) {
      await recordOwnerEvent(admin as never, {
        event_type: 'gym_claim_email_updated',
        user_id: user.id,
        metadata: {},
      })
    }

    return NextResponse.json({
      success: true,
      email: emailChanged ? newEmailRaw : user.email,
      claim_complete: emailChanged,
      email_warning: emailWarning,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to complete claim' },
      { status: 500 },
    )
  }
}
