export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePasswordRules } from '@/lib/auth/password-rules'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { current_password, new_password, sign_out_other_sessions } = await request.json()

    if (typeof current_password !== 'string' || typeof new_password !== 'string') {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
    }

    const validation = validatePasswordRules(new_password)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'New password does not meet security requirements',
          code: 'PASSWORD_RULES_FAILED',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    })

    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to update password' }, { status: 400 })
    }

    let signedOutOthers = false
    if (sign_out_other_sessions !== false) {
      // Best-effort: invalidate all other refresh tokens for this user.
      const { error: signOutErr } = await supabase.auth.signOut({ scope: 'others' })
      signedOutOthers = !signOutErr
      if (signOutErr) {
        console.warn('[password/update] sign out others failed:', signOutErr.message)
      }
    }

    await supabase.from('security_events').insert({
      user_id: user.id,
      event_type: 'password_changed',
      metadata: { signed_out_others: signedOutOthers },
    })

    if (signedOutOthers) {
      await recordOwnerEvent(supabase as never, {
        event_type: 'password_changed_signed_out_others',
        user_id: user.id,
        metadata: {},
      })
    }

    return NextResponse.json({
      success: true,
      signed_out_others: signedOutOthers,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update password' },
      { status: 500 }
    )
  }
}
