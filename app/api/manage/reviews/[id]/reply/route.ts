export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const reply = String(body?.reply || '').trim()
    if (!reply) {
      return NextResponse.json({ error: 'Reply is required' }, { status: 400 })
    }
    if (reply.length > 1000) {
      return NextResponse.json({ error: 'Reply must be 1000 characters or fewer' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: review, error: reviewError } = await admin
      .from('reviews')
      .select('id, gym_id')
      .eq('id', params.id)
      .maybeSingle()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (!review.gym_id) {
      return NextResponse.json({ error: 'Review is not linked to a gym' }, { status: 400 })
    }

    const { data: gym } = await admin
      .from('gyms')
      .select('id')
      .eq('id', review.gym_id)
      .eq('owner_id', access.userId)
      .maybeSingle()

    if (!gym) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const { error: updateError } = await admin
      .from('reviews')
      .update({
        owner_reply: reply,
        owner_replied_at: now,
        owner_replied_by: access.userId,
      })
      .eq('id', review.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save reply' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to reply to review' }, { status: 500 })
  }
}
