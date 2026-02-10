import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { sendAdminBookingEmail, sendUserConfirmationEmail } from '@/lib/email'

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
    const supabase = await createClient()
    const bookingId = params.id

    // Get booking with full details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(name, city, country, currency, owner:profiles!gyms_owner_id_fkey(full_name)),
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

    // Only send the initial "booking request received" email for pending_payment or pending_confirmation
    // Don't send if already confirmed (that email comes from webhook/capture)
    if (booking.status === 'confirmed') {
      console.log('ℹ️  Booking already confirmed - skipping initial notification email (confirmation email should come from webhook/capture)')
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
      
      // Generate magic link token
      let magicLink: string | undefined
      try {
        const tokenResponse = await fetch(
          `${request.nextUrl.origin}/api/bookings/${bookingId}/access-token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: booking.guest_email,
              expiresInDays: 90 
            }),
          }
        )

        if (tokenResponse.ok) {
          const { token } = await tokenResponse.json()
          magicLink = `${request.nextUrl.origin}/bookings/access/${token}`
          console.log('✅ Magic link generated for booking access')
        } else {
          console.warn('⚠️  Failed to generate magic link, continuing without it')
        }
      } catch (tokenError) {
        console.error('Error generating magic link:', tokenError)
        // Continue without magic link - not critical
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
