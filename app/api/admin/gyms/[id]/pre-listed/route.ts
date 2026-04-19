/**
 * Admin: toggle the `is_pre_listed` flag on a gym.
 *
 * Used by /admin/gyms to mark gyms the admin pre-created on behalf of a real
 * owner (so they show up in /admin/orphan-gyms ready for a claim link), and to
 * un-flag gyms the admin actually wants to keep (e.g. internal test gyms).
 *
 * The flag is also auto-cleared by `/api/admin/gyms/[id]/claim-link` once the
 * gym has been transferred to a placeholder owner — at that point the gym no
 * longer needs the flag because the placeholder filter takes over.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'

interface Params { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const gymId = params.id
  if (!gymId) {
    return NextResponse.json({ error: 'gym id is required' }, { status: 400 })
  }

  let body: { is_pre_listed?: boolean } = {}
  try { body = await request.json() } catch { /* empty body falls through */ }
  if (typeof body.is_pre_listed !== 'boolean') {
    return NextResponse.json(
      { error: 'is_pre_listed (boolean) is required' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('gyms')
    .update({ is_pre_listed: body.is_pre_listed })
    .eq('id', gymId)
    .select('id, is_pre_listed')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, gym: data })
}
