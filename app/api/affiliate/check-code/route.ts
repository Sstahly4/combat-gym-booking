export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeAffiliateCode, affiliateCodeValidationError } from '@/lib/affiliates/code'
import { isAffiliateCodeAvailable } from '@/lib/affiliates/intake'

export async function GET(request: NextRequest) {
  const code = normalizeAffiliateCode(request.nextUrl.searchParams.get('code') || '')
  const excludeId = request.nextUrl.searchParams.get('exclude_id') || undefined

  if (!code) {
    return NextResponse.json({ available: false, error: 'Code is required' }, { status: 400 })
  }

  const validationError = affiliateCodeValidationError(code)
  if (validationError) {
    return NextResponse.json({ available: false, error: validationError })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const available = await isAffiliateCodeAvailable(admin, code, excludeId)
  return NextResponse.json({ available, code })
}
