export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

export async function GET() {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: gyms, error: gymsError } = await admin
      .from('gyms')
      .select('id, name')
      .eq('owner_id', access.userId)
      .order('created_at', { ascending: false })

    if (gymsError) {
      return NextResponse.json({ error: 'Failed to load gyms' }, { status: 500 })
    }

    const gymIds = (gyms || []).map((gym) => gym.id)
    if (gymIds.length === 0) {
      return NextResponse.json({ reviews: [] })
    }

    const { data: reviews, error: reviewsError } = await admin
      .from('reviews')
      .select('id, booking_id, gym_id, reviewer_name, rating, comment, owner_reply, owner_replied_at, created_at')
      .in('gym_id', gymIds)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
    }

    const gymNameById = new Map((gyms || []).map((gym) => [gym.id, gym.name || 'Gym']))
    const merged = (reviews || []).map((review) => ({
      ...review,
      gym_name: review.gym_id ? gymNameById.get(review.gym_id) || 'Gym' : 'Gym',
    }))

    return NextResponse.json({ reviews: merged })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load owner reviews' }, { status: 500 })
  }
}
