export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePasswordRules } from '@/lib/auth/password-rules'

/**
 * Set a password for the first time on an invited account.
 *
 * Unlike /api/auth/password/update, this does NOT verify a current password —
 * the session obtained by clicking a Supabase invite link (inviteUserByEmail)
 * is already trusted by Supabase, so auth.updateUser() is safe without
 * re-authentication.
 *
 * Only allowed when the user has no password yet, identified by
 * onboarding_entry === 'self_serve' in user_metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow this path for users who arrived via the self-serve invite flow.
    // Everyone else must go through /api/auth/password/update (which requires current password).
    const onboardingEntry = user.user_metadata?.onboarding_entry
    if (onboardingEntry !== 'self_serve') {
      return NextResponse.json(
        { error: 'This endpoint is only available for newly invited accounts.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { new_password } = body

    if (typeof new_password !== 'string' || new_password.length === 0) {
      return NextResponse.json({ error: 'new_password is required' }, { status: 400 })
    }

    const validation = validatePasswordRules(new_password)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          code: 'PASSWORD_RULES_FAILED',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: new_password })
    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to set password' }, { status: 400 })
    }

    await supabase
      .from('profiles')
      .update({
        password_meets_current_policy: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    await supabase.from('security_events').insert({
      user_id: user.id,
      event_type: 'password_changed',
      metadata: { initial_set: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to set password' },
      { status: 500 }
    )
  }
}
