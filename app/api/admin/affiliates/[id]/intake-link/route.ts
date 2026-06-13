export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAffiliateIntakeToken } from '@/lib/affiliates/intake'
import {
  buildAffiliateIntakeUrl,
  isAffiliateIntakePepperConfigured,
  AFFILIATE_INTAKE_PEPPER_HELP,
} from '@/lib/affiliates/intake-token'

interface Params {
  params: { id: string }
}

function appOrigin(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  return request.nextUrl.origin
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!isAffiliateIntakePepperConfigured()) {
    return NextResponse.json(
      { error: 'Affiliate intake links are not configured.', help: AFFILIATE_INTAKE_PEPPER_HELP },
      { status: 503 }
    )
  }

  let body: { expires_in_days?: number } = {}
  try {
    body = await request.json()
  } catch {
    /* empty body ok */
  }

  const expiresInDays = Math.max(1, Math.min(60, Number(body.expires_in_days) || 14))
  const admin = createAdminClient()

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, name')
    .eq('id', params.id)
    .maybeSingle()

  if (!affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  try {
    const { plain, expiresAt } = await createAffiliateIntakeToken({
      admin,
      affiliateId: affiliate.id,
      createdBy: auth.user.id,
      expiresInDays,
    })

    const url = buildAffiliateIntakeUrl(appOrigin(request), plain)
    return NextResponse.json({
      url,
      expires_at: expiresAt,
      affiliate_name: affiliate.name,
      regenerated: true,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to generate link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
