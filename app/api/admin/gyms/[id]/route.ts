/**
 * Admin: permanently delete a gym (service role — bypasses RLS).
 * Requires typed confirmation of the gym name and the word DELETE.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidateGymCache } from '@/lib/seo/revalidate-gym'

interface Params {
  params: { id: string }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const gymId = params.id
  if (!gymId) {
    return NextResponse.json({ error: 'Gym id is required' }, { status: 400 })
  }

  let body: {
    confirm_gym_name?: string
    confirm_phrase?: string
    acknowledge_irreversible?: boolean
  } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.acknowledge_irreversible !== true) {
    return NextResponse.json(
      { error: 'You must confirm that you understand this action is irreversible.' },
      { status: 400 }
    )
  }

  const phrase = (body.confirm_phrase ?? '').trim()
  if (phrase !== 'DELETE') {
    return NextResponse.json(
      { error: 'Confirmation phrase must be exactly DELETE (all caps).' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: gym, error: gymErr } = await admin
    .from('gyms')
    .select('id, name')
    .eq('id', gymId)
    .maybeSingle()

  if (gymErr || !gym) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
  }

  const typedName = (body.confirm_gym_name ?? '').trim()
  if (typedName !== gym.name.trim()) {
    return NextResponse.json(
      { error: 'Gym name does not match exactly. Copy the listing name from above.' },
      { status: 400 }
    )
  }

  const { error: delErr } = await admin.from('gyms').delete().eq('id', gymId)

  if (delErr) {
    console.error('[admin delete gym]', delErr)
    return NextResponse.json(
      { error: delErr.message || 'Failed to delete gym' },
      { status: 500 }
    )
  }

  revalidateGymCache(gymId)

  return NextResponse.json({ ok: true, deleted_id: gymId })
}
