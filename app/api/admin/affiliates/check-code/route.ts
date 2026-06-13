export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeAffiliateCode } from '@/lib/affiliates/code'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const code = normalizeAffiliateCode(request.nextUrl.searchParams.get('code') || '')
  const excludeId = request.nextUrl.searchParams.get('exclude_id')

  if (!code) {
    return NextResponse.json({ available: false, error: 'Code is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  let query = admin.from('affiliates').select('id, code').eq('code', code)
  const { data, error } = await query.maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const taken = Boolean(data && data.id !== excludeId)
  return NextResponse.json({ available: !taken, code })
}
