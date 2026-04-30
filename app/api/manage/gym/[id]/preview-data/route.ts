export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Owner-only gym payload for listing preview (avoids public-page query edge cases).
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const gymId = params.id
    if (!gymId) {
      return NextResponse.json({ error: 'Missing gym id' }, { status: 400 })
    }

    const { data: gym, error: gymError } = await access.supabase
      .from('gyms')
      .select(
        `
        *,
        packages(*, variants:package_variants(*)),
        owner:profiles!gyms_owner_id_fkey(full_name)
      `
      )
      .eq('id', gymId)
      .eq('owner_id', access.userId)
      .maybeSingle()

    if (gymError) {
      return NextResponse.json({ error: 'Failed to load gym' }, { status: 500 })
    }

    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    // The owner has been verified against this gym above. Use the service-role
    // client for preview-only child rows so draft/private listing images are not
    // hidden by public listing RLS policies.
    const admin = createAdminClient()

    const { data: images, error: imgError } = await admin
      .from('gym_images')
      .select('*')
      .eq('gym_id', gymId)
      .order('order', { ascending: true, nullsFirst: false })

    if (imgError) {
      return NextResponse.json({ error: 'Failed to load images' }, { status: 500 })
    }

    const { data: bookingRows } = await access.supabase
      .from('bookings')
      .select('id, user_id, reviews(*)')
      .eq('gym_id', gymId)

    const bookingReviews = (bookingRows || []).flatMap((b: any) =>
      (b.reviews || []).map((r: any) => ({
        ...r,
        booking: { user_id: b.user_id },
      }))
    )

    const { data: manualReviewsRaw } = await access.supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_name')
      .eq('gym_id', gymId)
      .eq('manual_review', true)
      .limit(10)

    const manualReviews = manualReviewsRaw || []

    const reviews = [
      ...bookingReviews,
      ...manualReviews.map((r: any) => ({ ...r, booking: null })),
    ]

    const sortedImages = (images || []).sort((a: any, b: any) => {
      const orderA = a.order != null ? a.order : 999
      const orderB = b.order != null ? b.order : 999
      return orderA - orderB
    })

    return NextResponse.json({
      gym: {
        ...gym,
        images: sortedImages,
        reviews,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load preview' },
      { status: 500 }
    )
  }
}
