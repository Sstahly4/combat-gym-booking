/**
 * POST /api/auth/evaluate-password
 *
 * Called from the client right after a successful password sign-in. We re-run
 * the current password rules against the plaintext the user just typed (the
 * only moment we're allowed to see it) and cache the verdict on the profile.
 *
 * If the password fails and the user is an owner, we insert a
 * password_policy_update notification so their navbar bell lights up. Dedupe
 * by "no existing unread row of this type" so repeat sign-ins don't stack
 * notifications.
 *
 * This endpoint never rejects or logs the user out — it's purely informational.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePasswordRules } from '@/lib/auth/password-rules'

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

    const body = await request.json().catch(() => ({}))
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const { valid } = validatePasswordRules(password)

    // Load the current flag + role so we only insert the owner notification
    // when something actually changed (and only for owners).
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, password_meets_current_policy')
      .eq('id', user.id)
      .maybeSingle()

    const previousMeets = profile?.password_meets_current_policy ?? true
    if (previousMeets !== valid) {
      await supabase
        .from('profiles')
        .update({
          password_meets_current_policy: valid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    if (!valid && profile?.role === 'owner') {
      const { data: existing } = await supabase
        .from('owner_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'password_policy_update')
        .is('read_at', null)
        .limit(1)
        .maybeSingle()

      if (!existing) {
        await supabase.from('owner_notifications').insert({
          user_id: user.id,
          type: 'password_policy_update',
          title: 'Update your password to our new standard',
          body: 'We recently raised our password requirements. Please update your password to meet the new standard.',
          link_href: '/manage/settings?tab=security',
          metadata: { reason: 'policy_tightened' },
        })
      }
    }

    return NextResponse.json({ meets_policy: valid })
  } catch (error: any) {
    // Never block sign-in on this — swallow the error on the client side.
    return NextResponse.json(
      { error: error?.message || 'Failed to evaluate password' },
      { status: 500 }
    )
  }
}
