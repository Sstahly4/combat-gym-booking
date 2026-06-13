export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AFFILIATE_REF_COOKIE,
  AFFILIATE_REF_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/affiliates/constants'
import { normalizeAffiliateCode } from '@/lib/affiliates/code'

interface Params {
  params: { code: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  const code = normalizeAffiliateCode(params.code || '')
  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('code, status')
    .eq('code', code)
    .maybeSingle()

  const redirect = NextResponse.redirect(new URL('/', request.url))

  if (!affiliate || affiliate.status !== 'active') {
    return redirect
  }

  // First-touch attribution — do not overwrite an existing referral cookie.
  const existing = request.cookies.get(AFFILIATE_REF_COOKIE)?.value
  if (!existing) {
    redirect.cookies.set({
      name: AFFILIATE_REF_COOKIE,
      value: code,
      path: '/',
      maxAge: AFFILIATE_REF_COOKIE_MAX_AGE_SECONDS,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  const userAgent = request.headers.get('user-agent')?.slice(0, 512) || null
  const landingUrl = request.nextUrl.pathname + (request.nextUrl.search || '')

  admin
    .from('affiliate_clicks')
    .insert({
      affiliate_code: code,
      landing_url: landingUrl,
      user_agent: userAgent,
    })
    .then(({ error }) => {
      if (error) console.warn('[ref] click log failed', error.message)
    })

  return redirect
}
