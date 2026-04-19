export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureEnabled } from '@/lib/flags/feature-flags'
import {
  RECOVERY_CODE_BATCH_SIZE,
  generatePlainRecoveryCodes,
  hashRecoveryCode,
} from '@/lib/auth/mfa-recovery-codes'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

// GET — return remaining (unconsumed) count for the current user.
export async function GET(_request: NextRequest) {
  if (!isFeatureEnabled('mfa_recovery_codes')) {
    return NextResponse.json({ enabled: false, remaining: 0 })
  }
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { count, error } = await supabase
    .from('mfa_recovery_codes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('consumed_at', null)

  if (error) {
    return NextResponse.json({ error: 'Failed to read recovery codes' }, { status: 500 })
  }

  return NextResponse.json({ enabled: true, remaining: count ?? 0 })
}

// POST — (re)generate a fresh batch of recovery codes for the current user.
// Replaces existing codes (consumed or not). Plaintext returned ONCE.
export async function POST(_request: NextRequest) {
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

  const plain = generatePlainRecoveryCodes(RECOVERY_CODE_BATCH_SIZE)
  const rows = plain.map((code) => ({
    user_id: user.id,
    code_hash: hashRecoveryCode(code),
  }))

  const { error: deleteError } = await supabase
    .from('mfa_recovery_codes')
    .delete()
    .eq('user_id', user.id)
  if (deleteError) {
    return NextResponse.json({ error: 'Failed to rotate recovery codes' }, { status: 500 })
  }

  const { error: insertError } = await supabase.from('mfa_recovery_codes').insert(rows)
  if (insertError) {
    return NextResponse.json({ error: 'Failed to store recovery codes' }, { status: 500 })
  }

  await supabase.from('security_events').insert({
    user_id: user.id,
    event_type: 'mfa_recovery_codes_generated',
    metadata: { count: plain.length },
  })
  await recordOwnerEvent(supabase as never, {
    event_type: 'mfa_recovery_codes_generated',
    user_id: user.id,
    metadata: { count: plain.length },
  })

  return NextResponse.json({ codes: plain, count: plain.length })
}
