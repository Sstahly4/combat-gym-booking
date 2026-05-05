import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runPartnerOnboardingEmailCron } from '@/lib/partner-emails/partner-email-sequence'

export const dynamic = 'force-dynamic'

/**
 * Hourly job: partner checklist email (dynamic readiness) and day-3 nudge for
 * owners who are still not live. Secured with CRON_SECRET (Vercel Cron or manual).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 501 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })
  }

  try {
    const result = await runPartnerOnboardingEmailCron(admin)
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    console.error('[cron/partner-onboarding-emails]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Cron failed' },
      { status: 500 },
    )
  }
}
