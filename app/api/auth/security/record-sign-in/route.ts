export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { isFeatureEnabled } from '@/lib/flags/feature-flags'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

function deviceFingerprint(userAgent: string | null, clientHint: string | null): string {
  const seed = `${userAgent ?? ''}|${clientHint ?? ''}`
  return createHash('sha256').update(seed).digest('hex').slice(0, 32)
}

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

    let body: { client_hint?: string } = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || null
    const ua = h.get('user-agent')
    const clientHint = typeof body.client_hint === 'string' ? body.client_hint : null
    const fingerprint = deviceFingerprint(ua, clientHint)

    // Detect "new device": no previous sign_in for this user with the same fingerprint.
    let isNewDevice = false
    if (isFeatureEnabled('new_device_alerts')) {
      const { data: priorMatches, error: priorErr } = await supabase
        .from('security_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_type', 'sign_in')
        .contains('metadata', { fingerprint })
        .limit(1)
      if (!priorErr) {
        isNewDevice = (priorMatches?.length ?? 0) === 0
      }
    }

    const { error } = await supabase.from('security_events').insert({
      user_id: user.id,
      event_type: 'sign_in',
      metadata: {
        client_hint: clientHint ?? undefined,
        ip,
        user_agent: ua,
        fingerprint,
        new_device: isNewDevice || undefined,
      },
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to record sign-in' }, { status: 500 })
    }

    if (isNewDevice) {
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'new_device_sign_in',
        metadata: { fingerprint, ip, user_agent: ua },
      })
      await recordOwnerEvent(supabase as never, {
        event_type: 'new_device_sign_in',
        user_id: user.id,
        metadata: { fingerprint, ip },
      })
      // Email notification is handled by a downstream notification worker that
      // observes `new_device_sign_in` security_events; we keep this endpoint
      // synchronous-cheap.
    }

    return NextResponse.json({ success: true, new_device: isNewDevice })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to record sign-in' },
      { status: 500 }
    )
  }
}
