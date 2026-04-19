/**
 * POST /api/reviews/notify-owner
 *
 * Fires the owner "you got a new review" email (gated by their email
 * preferences). The bell row is written by a DB trigger so this endpoint is
 * email-only and best-effort.
 *
 * Body: { booking_id: string }
 *
 * Anyone who can produce a valid booking id (incl. anonymous / guest review
 * submissions) may call this; we do server-side validation by:
 *   - looking up the review for that booking (must exist)
 *   - resolving the owner via gyms.owner_id (admin client)
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeOwnerNotificationPrefs } from '@/lib/manage/owner-notification-prefs'
import { sendOwnerReviewPostedEmail } from '@/lib/email-owner-notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const bookingId = typeof body?.booking_id === 'string' ? body.booking_id : null
    if (!bookingId) {
      return NextResponse.json({ error: 'booking_id required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: review } = await admin
      .from('reviews')
      .select('id, rating, comment, booking_id')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!review) {
      return NextResponse.json({ ok: true, skipped: 'no_review' })
    }

    const { data: booking } = await admin
      .from('bookings')
      .select('gym_id')
      .eq('id', bookingId)
      .maybeSingle()
    if (!booking?.gym_id) {
      return NextResponse.json({ ok: true, skipped: 'no_gym' })
    }

    const { data: gym } = await admin
      .from('gyms')
      .select('id, name, owner_id')
      .eq('id', booking.gym_id)
      .maybeSingle()
    if (!gym?.owner_id) {
      return NextResponse.json({ ok: true, skipped: 'no_owner' })
    }

    // Pref-gate the email. (We don't write the bell row here — DB trigger does.)
    const { data: profile } = await admin
      .from('profiles')
      .select('owner_notification_prefs')
      .eq('id', gym.owner_id)
      .maybeSingle()
    const prefs = normalizeOwnerNotificationPrefs(
      (profile as { owner_notification_prefs?: unknown } | null)?.owner_notification_prefs ?? null,
    )
    if (!prefs.email_marketing && !prefs.email_bookings) {
      // We currently piggy-back off email_bookings as the closest channel for
      // gym activity; future migration can introduce a dedicated email_reviews
      // toggle. For now: skip cleanly if owner has muted booking emails too.
      return NextResponse.json({ ok: true, skipped: 'pref_off' })
    }

    const { data: ownerAuth } = await admin.auth.admin.getUserById(gym.owner_id)
    const ownerEmail = ownerAuth?.user?.email
    if (!ownerEmail) {
      return NextResponse.json({ ok: true, skipped: 'no_email' })
    }

    await sendOwnerReviewPostedEmail({
      ownerEmail,
      gymName: gym.name || 'your gym',
      rating: review.rating ?? 0,
      comment: review.comment ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.warn('[reviews/notify-owner] failed', err)
    // Never bubble up to the guest who just left a review.
    return NextResponse.json({ ok: true, error: err?.message })
  }
}
