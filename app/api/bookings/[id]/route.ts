import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, PLATFORM_COMMISSION_RATE } from '@/lib/stripe'
import { computeBreakdownForStay } from '@/lib/booking/resolve-booking-price'
import { assertDropInCapacityAvailable } from '@/lib/packages/drop-in-capacity'
import {
  cancellationPolicyToStripeMetadata,
  resolveCancellationPolicy,
} from '@/lib/booking/cancellation-policy'
import type { GymCancellationPolicyTone } from '@/lib/booking/cancellation-policy'
import {
  BOOKING_DATES_EXPIRED_ERROR,
  isBookingStartDateInPast,
} from '@/lib/booking/validate-booking-dates'
import { isDropInPackage, validateDropInBookingDates } from '@/lib/packages/drop-in'

/**
 * Fetch a single booking with its related gym/package/variant.
 *
 * Auth is delegated to Row Level Security on `public.bookings`, which allows:
 *   - The booking's owner (auth.uid() = bookings.user_id)
 *   - Guest bookings where user_id IS NULL (security enforced at app layer via
 *     magic-link tokens and PIN/reference codes)
 *   - The gym owner of the booking
 *   - Admin users
 *
 * Anything RLS hides shows up as a "not found" here, which is intentional.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const bookingId = params.id

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(*, images:gym_images(url, variants, order, focus_x, focus_y)),
        package:packages(*),
        variant:package_variants(*)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      if (bookingError && bookingError.code !== 'PGRST116') {
        console.error('Booking query error:', bookingError)
      }
      return NextResponse.json(
        { error: 'Booking not found', details: bookingError?.message },
        { status: 404 }
      )
    }

    return NextResponse.json(booking, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error: any) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

/**
 * Update pending booking dates (and recalculated price) during checkout.
 * Guest bookings use the admin client — RLS only allows UPDATE for auth.uid() = user_id.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const body = await request.json().catch(() => ({}))
    const start_date = typeof body.start_date === 'string' ? body.start_date.trim() : ''
    const end_date = typeof body.end_date === 'string' ? body.end_date.trim() : ''

    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    if (new Date(end_date) < new Date(start_date)) {
      return NextResponse.json({ error: 'checkout must be on or after checkin' }, { status: 400 })
    }

    if (isBookingStartDateInPast(start_date)) {
      return NextResponse.json({ error: BOOKING_DATES_EXPIRED_ERROR }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        gym:gyms(cancellation_policy_tone),
        package:packages(id, type, offer_type, daily_capacity, price_per_day, price_per_week, price_per_month, cancellation_policy_days),
        variant:package_variants(id, price_per_day, price_per_week, price_per_month, once_daily_price_per_day, once_daily_price_per_week, once_daily_price_per_month)
      `
      )
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.user_id && (!user || booking.user_id !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending bookings can be updated during checkout' },
        { status: 400 }
      )
    }

    const pkg = booking.package as {
      id: string
      type: 'training' | 'accommodation' | 'all_inclusive'
      offer_type?: string | null
      daily_capacity?: number | null
      price_per_day: number | null
      price_per_week: number | null
      price_per_month: number | null
      cancellation_policy_days: number | null
    } | null

    if (!pkg) {
      return NextResponse.json({ error: 'Booking package not found' }, { status: 400 })
    }

    const dropInDateError = validateDropInBookingDates(pkg.offer_type, start_date, end_date)
    if (dropInDateError) {
      return NextResponse.json({ error: dropInDateError }, { status: 400 })
    }

    if (
      !isDropInPackage({ offer_type: pkg.offer_type }) &&
      pkg.type !== 'training' &&
      new Date(end_date) <= new Date(start_date)
    ) {
      return NextResponse.json({ error: 'checkout must be after checkin' }, { status: 400 })
    }

    const dbForRates = booking.user_id && user ? supabase : createAdminClient()
    const capacityCheck = await assertDropInCapacityAvailable(createAdminClient(), {
      packageId: pkg.id,
      offerType: pkg.offer_type,
      dailyCapacity: pkg.daily_capacity,
      visitDate: start_date,
      excludeBookingId: bookingId,
    })
    if (!capacityCheck.ok) {
      return NextResponse.json({ error: capacityCheck.error }, { status: 409 })
    }

    const variant = booking.variant as {
      id: string
      price_per_day: number | null
      price_per_week: number | null
      price_per_month: number | null
      once_daily_price_per_day?: number | null
      once_daily_price_per_week?: number | null
      once_daily_price_per_month?: number | null
    } | null

    const trainingTier =
      booking.training_tier === 'once_daily' || booking.training_tier === 'twice_daily'
        ? booking.training_tier
        : 'twice_daily'

    const { data: seasonalRows } = await dbForRates
      .from('package_seasonal_rates')
      .select('*')
      .eq('package_id', pkg.id)
      .lte('start_date', end_date)
      .gte('end_date', start_date)

    const priceInfo = computeBreakdownForStay(
      pkg.id,
      pkg,
      variant,
      seasonalRows ?? [],
      start_date,
      end_date,
      trainingTier
    )
    if (!priceInfo || priceInfo.price <= 0) {
      return NextResponse.json({ error: 'Invalid date range for pricing' }, { status: 400 })
    }

    const total_price = priceInfo.price
    const platform_fee = Number((total_price * PLATFORM_COMMISSION_RATE).toFixed(2))

    const gym = booking.gym as { cancellation_policy_tone?: string | null } | null
    const policy = resolveCancellationPolicy({
      startDate: start_date,
      packageCancellationPolicyDays: pkg.cancellation_policy_days ?? null,
      gymPolicyTone: (gym?.cancellation_policy_tone as GymCancellationPolicyTone | null) ?? null,
      asOf: new Date(),
    })

    const priceChanged = Number(booking.total_price) !== total_price
    const datesChanged =
      booking.start_date !== start_date || booking.end_date !== end_date

    if (!datesChanged && !priceChanged) {
      return NextResponse.json(booking)
    }

    if (priceChanged && booking.stripe_payment_intent_id && stripe) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
        if (existing.status !== 'canceled') {
          await stripe.paymentIntents.cancel(booking.stripe_payment_intent_id)
        }
      } catch (cancelErr) {
        console.warn('Could not cancel payment intent after date change:', cancelErr)
      }
    }

    const updatePayload = {
      start_date,
      end_date,
      total_price,
      platform_fee,
      cancellation_policy_snapshot: policy.snapshot as unknown as Record<string, unknown>,
      ...(priceChanged ? { stripe_payment_intent_id: null } : {}),
    }

    const db =
      booking.user_id && user
        ? supabase
        : createAdminClient()

    const { data: updated, error: updateError } = await db
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId)
      .eq('status', 'pending')
      .select(
        `
        *,
        gym:gyms(*, images:gym_images(url, variants, order, focus_x, focus_y)),
        package:packages(*),
        variant:package_variants(*)
      `
      )
      .single()

    if (updateError || !updated) {
      console.error('Booking date update error:', updateError)
      return NextResponse.json({ error: 'Failed to update booking dates' }, { status: 500 })
    }

    return NextResponse.json({
      ...updated,
      payment_intent_reset: priceChanged,
      cancellation_policy: cancellationPolicyToStripeMetadata(policy.snapshot),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update booking'
    console.error('PATCH booking error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
