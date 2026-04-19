export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabled } from '@/lib/flags/feature-flags'
import { hashRecoveryCode } from '@/lib/auth/mfa-recovery-codes'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

// POST — consume a single recovery code as an MFA fallback.
// Body: { code: string }
// On success: { ok: true, remaining: number }
//
// NOTE: This endpoint validates and burns the code. It is the caller's job
// (sign-in flow) to bind this to a successful authentication attempt and to
// downgrade-MFA the session via Supabase Auth (out of scope here).
export async function POST(request: NextRequest) {
  if (!isFeatureEnabled('mfa_recovery_codes')) {
    return NextResponse.json({ error: 'Recovery codes are disabled' }, { status: 403 })
  }
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { code?: string } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code || code.replace(/[\s-]/g, '').length < 8) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  const codeHash = hashRecoveryCode(code)
  const { data: row, error: findErr } = await supabase
    .from('mfa_recovery_codes')
    .select('id, consumed_at')
    .eq('user_id', user.id)
    .eq('code_hash', codeHash)
    .maybeSingle()

  if (findErr) {
    return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 })
  }
  if (!row || row.consumed_at) {
    return NextResponse.json({ ok: false, error: 'Invalid or used code' }, { status: 400 })
  }

  const { error: updateErr } = await supabase
    .from('mfa_recovery_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)
  if (updateErr) {
    return NextResponse.json({ error: 'Failed to consume code' }, { status: 500 })
  }

  const { count } = await supabase
    .from('mfa_recovery_codes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('consumed_at', null)

  await supabase.from('security_events').insert({
    user_id: user.id,
    event_type: 'mfa_recovery_code_consumed',
    metadata: { remaining: count ?? 0 },
  })
  await recordOwnerEvent(supabase as never, {
    event_type: 'mfa_recovery_code_consumed',
    user_id: user.id,
    metadata: { remaining: count ?? 0 },
  })

  return NextResponse.json({ ok: true, remaining: count ?? 0 })
}
