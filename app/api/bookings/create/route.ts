import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordOwnerNotification } from '@/lib/notifications/owner-notifications'
import { sendOwnerBookingCreatedEmail } from '@/lib/email-owner-notifications'
import { sendGuestBookingRequestedEmail } from '@/lib/email'

const PLATFORM_COMMISSION_RATE = parseFloat(
  process.env.PLATFORM_COMMISSION_RATE || '0.15'
)

// Generate booking reference (e.g., "BK-ABC123")
function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
  const random = randomBytes(3)
  let ref = 'BK-'
  for (let i = 0; i < 3; i++) {
    ref += chars[random[i] % chars.length]
  }
  return ref
}

// Generate 6-digit PIN
function generateBookingPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { 
      gym_id, 
      package_id, 
      package_variant_id, 
      start_date, 
      end_date, 
      discipline, 
      experience_level, 
      notes, 
      total_price, 
      guest_email,
      guest_phone,
      guest_name
    } = body

    // Validate required fields
    if (!gym_id || !start_date || !end_date || !discipline || !experience_level || !total_price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Server is the source of truth for commission. Never trust client-supplied
    // platform_fee — recompute from total_price and the configured rate.
    const platform_fee = Number((Number(total_price) * PLATFORM_COMMISSION_RATE).toFixed(2))

    // For guest bookings, require email, phone, and name
    if (!user && (!guest_email || !guest_phone || !guest_name)) {
      return NextResponse.json({ error: 'Guest bookings require email, phone, and name' }, { status: 400 })
    }

    // Verify gym exists and is verified (not draft)
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name, owner_id, verification_status, status, country, currency')
      .eq('id', gym_id)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    // Block bookings for draft gyms
    if (gym.verification_status === 'draft') {
      return NextResponse.json({ error: 'This gym is not yet verified and cannot accept bookings' }, { status: 400 })
    }

    // Keep legacy status check for compatibility
    if (gym.status !== 'approved') {
      return NextResponse.json({ error: 'Gym is not approved for bookings' }, { status: 400 })
    }

    // Check package booking_mode if package_id is provided. Also grab the
    // human-readable package/variant names so the guest confirmation email
    // can render a proper reservation summary.
    let bookingMode: 'request_to_book' | 'instant' = 'request_to_book' // Default to request-to-book
    let packageName: string | undefined
    let mealPlanDetails: unknown = null
    if (package_id) {
      const { data: packageData } = await supabase
        .from('packages')
        .select('booking_mode, name, meal_plan_details')
        .eq('id', package_id)
        .single()

      if (packageData?.booking_mode) {
        bookingMode = packageData.booking_mode as 'request_to_book' | 'instant'
      }
      packageName = packageData?.name ?? undefined
      mealPlanDetails = packageData?.meal_plan_details ?? null
    }

    let variantName: string | undefined
    if (package_variant_id) {
      const { data: variantData } = await supabase
        .from('package_variants')
        .select('name')
        .eq('id', package_variant_id)
        .single()
      variantName = variantData?.name ?? undefined
    }

    // Dedup guard: if the same guest submitted an identical pending booking
    // in the last 2 minutes (rapid double-click / retry), reuse that booking
    // instead of creating a new row. Prevents the "gym got 3 New booking
    // request emails" case where each insert also fires an owner notification.
    const dedupEmail = (guest_email || '').toString().toLowerCase().trim()
    if (dedupEmail) {
      const twoMinutesAgoIso = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { data: recent } = await supabase
        .from('bookings')
        .select('id, booking_reference, booking_pin, request_submitted_at')
        .eq('gym_id', gym_id)
        .eq('guest_email', dedupEmail)
        .eq('start_date', start_date)
        .eq('end_date', end_date)
        .eq('status', 'pending')
        .gte('request_submitted_at', twoMinutesAgoIso)
        .order('request_submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (recent?.id) {
        console.log('[bookings/create] reusing recent pending booking', recent.booking_reference)
        return NextResponse.json({
          booking_id: recent.id,
          booking_reference: recent.booking_reference,
          booking_pin: recent.booking_pin,
          deduplicated: true,
        })
      }
    }

    // Generate booking reference and PIN
    let bookingReference = generateBookingReference()
    let bookingPin = generateBookingPin()
    
    // Ensure unique reference (retry if collision)
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_reference', bookingReference)
        .single()
      
      if (!existing) break
      bookingReference = generateBookingReference()
      attempts++
    }

    // Canonical status model starts all new bookings as `pending`.
    const initialStatus = 'pending'
    const requestSubmittedAt = new Date().toISOString()

    // Create booking (guest or authenticated)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user?.id || null,  // Null for guest bookings
        gym_id,
        package_id: package_id || null,
        package_variant_id: package_variant_id || null,
        start_date,
        end_date,
        discipline,
        experience_level,
        notes: notes || null,
        total_price,
        platform_fee,
        status: initialStatus,
        request_submitted_at: requestSubmittedAt,
        guest_email: dedupEmail || null,
        guest_phone: guest_phone || null,
        guest_name: guest_name || null,
        booking_reference: bookingReference,
        booking_pin: bookingPin,
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Best-effort: light up the owner's bell + email (gated by their prefs).
    if (gym.owner_id) {
      const adminSb = createAdminClient()
      void recordOwnerNotification(adminSb, {
        user_id: gym.owner_id,
        gym_id: gym.id,
        type: 'booking_created',
        title: `New booking request for ${gym.name || 'your gym'}`,
        body: `${guest_name || 'A guest'} requested ${start_date} \u2192 ${end_date}.`,
        link_href: `/manage/bookings?ref=${bookingReference}`,
        metadata: {
          booking_id: booking.id,
          booking_reference: bookingReference,
          start_date,
          end_date,
        },
        email: {
          pref_key: 'email_bookings',
          send: async () => {
            try {
              const { data: ownerAuth } = await adminSb.auth.admin.getUserById(gym.owner_id)
              const ownerEmail = ownerAuth?.user?.email
              if (!ownerEmail) return false
              return await sendOwnerBookingCreatedEmail({
                ownerEmail,
                gymName: gym.name || 'your gym',
                bookingReference,
                guestName: guest_name || 'A guest',
                startDate: start_date,
                endDate: end_date,
                totalPrice: typeof total_price === 'number' ? total_price : undefined,
              })
            } catch (err) {
              console.warn('[bookings/create] owner email lookup failed', err)
              return false
            }
          },
        },
      })
    }

    // Best-effort: email the traveler a "booking request received" confirmation
    // immediately, before they move on to the payment step. Guarantees they
    // always have their reference + PIN on file even if they bail on payment.
    const travelerEmail = dedupEmail || null
    if (travelerEmail) {
      const origin = request.nextUrl.origin || ''
      const paymentLink = `${origin}/bookings/${booking.id}/payment`
      void sendGuestBookingRequestedEmail({
        bookingReference,
        bookingPin,
        guestName: guest_name || 'Guest',
        guestEmail: travelerEmail,
        gymName: gym.name || 'your gym',
        gymCountry: gym.country || '',
        startDate: start_date,
        endDate: end_date,
        packageName,
        variantName,
        totalPrice: typeof total_price === 'number' ? total_price : Number(total_price) || 0,
        currency: gym.currency || 'USD',
        paymentLink,
        mealPlanDetails: (mealPlanDetails as any) || null,
      }).catch((err) => {
        console.warn('[bookings/create] guest email failed', err)
      })
    }

    return NextResponse.json({
      booking_id: booking.id,
      booking_reference: bookingReference,
      booking_pin: bookingPin,
    })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
