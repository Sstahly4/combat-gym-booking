import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { sendAdminBookingEmail, sendUserConfirmationEmail } from '@/lib/email'
import { recordOwnerNotification } from '@/lib/notifications/owner-notifications'
import { sendOwnerBookingCreatedEmail } from '@/lib/email-owner-notifications'

/**
 * Send email notifications for new bookings
 * Fetches payment details from Stripe and sends admin + user emails
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📧 Notification endpoint called for booking:', params.id)
    // Use the service-role client here. /notify is invoked server-to-server from
    // /confirm-payment without forwarding the caller's cookies, so a session-aware
    // client would hit RLS and return no booking for guest checkouts (user_id null).
    const adminSb = createAdminClient()
    const bookingId = params.id

    // Get booking with full details
    const { data: booking, error: bookingError } = await adminSb
      .from('bookings')
      .select(`
        *,
        gym:gyms(id, name, city, country, currency, owner_id, owner:profiles!gyms_owner_id_fkey(full_name)),
        package:packages(name, includes_meals, meal_plan_details),
        variant:package_variants(name)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking fetch error in notify endpoint:', bookingError)
      return NextResponse.json(
        { error: 'Failed to load booking details for notification' },
        { status: 500 }
      )
    }

    console.log('Booking found, status:', booking.status)

    // Only send the initial "booking request received" email for non-finalized bookings.
    // Finalized states send dedicated confirmation/capture lifecycle emails.
    if (booking.status === 'paid' || booking.status === 'completed') {
      console.log('ℹ️  Booking already paid/completed - skipping initial notification email')
      return NextResponse.json({ success: true, skipped: 'already_confirmed' })
    }

    const gym = booking.gym as any
    const package_ = booking.package as any
    const variant = booking.variant as any

    // Fetch payment intent details from Stripe to get card info
    let cardLast4: string | undefined
    let cardBrand: string | undefined
    let paymentStatus = 'pending'

    if (booking.stripe_payment_intent_id && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
        paymentStatus = paymentIntent.status

        // Get payment method details if available
        if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
          cardLast4 = paymentMethod.card?.last4
          cardBrand = paymentMethod.card?.brand
        }
      } catch (stripeError) {
        console.error('Error fetching payment intent from Stripe:', stripeError)
        // Continue without card details
      }
    }

    const duration = Math.floor(
      (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    console.log('Sending admin email...')
    // Gym owner: same moment as guest — card is authorized, request is real.
    const ownerId = gym.owner_id as string | undefined
    if (ownerId) {
      void recordOwnerNotification(adminSb, {
        user_id: ownerId,
        gym_id: gym.id,
        type: 'booking_created',
        title: `New booking request for ${gym.name || 'your gym'}`,
        body: `${booking.guest_name || 'A guest'} requested ${booking.start_date} \u2192 ${booking.end_date}.`,
        link_href: `/manage/bookings?ref=${booking.booking_reference || bookingId}`,
        metadata: {
          booking_id: bookingId,
          booking_reference: booking.booking_reference,
          start_date: booking.start_date,
          end_date: booking.end_date,
        },
        email: {
          pref_key: 'email_bookings',
          send: async () => {
            try {
              const { data: ownerAuth } = await adminSb.auth.admin.getUserById(ownerId)
              const ownerEmail = ownerAuth?.user?.email
              if (!ownerEmail) return false
              return await sendOwnerBookingCreatedEmail({
                ownerEmail,
                gymName: gym.name || 'your gym',
                bookingReference: booking.booking_reference || bookingId,
                guestName: booking.guest_name || 'A guest',
                startDate: booking.start_date,
                endDate: booking.end_date,
                totalPrice: typeof booking.total_price === 'number' ? booking.total_price : undefined,
                currency: gym.currency || 'USD',
              })
            } catch (err) {
              console.warn('[bookings/notify] owner email lookup failed', err)
              return false
            }
          },
        },
      })
    }

    // Send admin email
    await sendAdminBookingEmail({
      bookingReference: booking.booking_reference || bookingId,
      bookingPin: booking.booking_pin || 'N/A',
      gymName: gym.name,
      gymCity: gym.city,
      gymCountry: gym.country,
      gymOwnerEmail: gym.owner?.email,
      gymOwnerName: gym.owner?.full_name,
      packageName: package_?.name,
      variantName: variant?.name,
      startDate: booking.start_date,
      endDate: booking.end_date,
      duration,
      guestName: booking.guest_name || 'N/A',
      guestEmail: booking.guest_email || 'N/A',
      guestPhone: booking.guest_phone,
      discipline: booking.discipline,
      experienceLevel: booking.experience_level,
      notes: booking.notes || undefined,
      totalPrice: booking.total_price,
      platformFee: booking.platform_fee,
      currency: gym.currency || 'USD',
      paymentIntentId: booking.stripe_payment_intent_id || 'Not created',
      paymentStatus: paymentStatus,
      cardLast4,
      cardBrand: cardBrand ? cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1) : undefined,
    })

    // Send user confirmation email with magic link
    if (booking.guest_email) {
      console.log('Sending user confirmation email to:', booking.guest_email)

      // Generate magic link inline (admin client, bypasses RLS). The previous
      // /access-token internal fetch could fail silently for guest bookings.
      let magicLink: string | undefined
      try {
        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 90)

        const { error: tokenError } = await adminSb
          .from('booking_access_tokens')
          .insert({
            booking_id: bookingId,
            token_hash: tokenHash,
            email: booking.guest_email.toLowerCase(),
            expires_at: expiresAt.toISOString(),
            is_single_use: false,
          })

        if (!tokenError) {
          magicLink = `${request.nextUrl.origin}/bookings/access/${rawToken}`
          console.log('✅ Magic link generated for booking access')
        } else {
          console.warn('⚠️  Failed to generate magic link:', tokenError.message)
        }
      } catch (tokenError) {
        console.error('Error generating magic link:', tokenError)
      }

      await sendUserConfirmationEmail({
        bookingReference: booking.booking_reference || bookingId,
        bookingPin: booking.booking_pin || 'N/A',
        guestName: booking.guest_name || 'Guest',
        guestEmail: booking.guest_email,
        gymName: gym.name,
        gymCountry: gym.country,
        startDate: booking.start_date,
        endDate: booking.end_date,
        packageName: package_?.name,
        variantName: variant?.name,
        totalPrice: booking.total_price,
        currency: gym.currency || 'USD',
        cardLast4,
        cardBrand: cardBrand ? cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1) : undefined,
        paymentDate: new Date().toISOString(),
        mealPlanDetails: package_?.meal_plan_details || null,
        magicLink,
      })
    }

    console.log('✅ All notifications sent successfully')
    return NextResponse.json({ success: true, message: 'Notifications sent' })
  } catch (error: any) {
    console.error('❌ Error sending notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
