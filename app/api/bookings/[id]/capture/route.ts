import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { sendBookingConfirmedEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // MVP: Only admin/platform can capture payments (manual process)
    // Later: Gym owners can confirm, but platform captures
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Allow admin or owner (owner confirms, admin captures)
      if (profile?.role !== 'admin' && profile?.role !== 'owner') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const bookingId = params.id

    // Get booking with full details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(name, city, country, currency, owner_id),
        package:packages(name, includes_meals, meal_plan_details),
        variant:package_variants(name)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // MVP: Allow capture if status is pending_confirmation (after gym confirms)
    // Also allow if already confirmed (in case payment was captured manually in Stripe)
    if (booking.status !== 'pending_confirmation' && booking.status !== 'awaiting_approval' && booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 })
    }

    if (!booking.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 400 })
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 500 }
      )
    }

    // Check if payment is already captured
    let paymentAlreadyCaptured = false
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
      if (paymentIntent.status === 'succeeded') {
        paymentAlreadyCaptured = true
        console.log('Payment already captured in Stripe, updating booking status and sending email')
      }
    } catch (stripeError) {
      console.error('Error checking payment intent status:', stripeError)
    }

    // Capture the payment (money moves from user to platform) if not already captured
    if (!paymentAlreadyCaptured) {
      try {
        await stripe.paymentIntents.capture(booking.stripe_payment_intent_id)
        console.log('✅ Payment captured successfully')
      } catch (captureError: any) {
        // If already captured, that's okay - continue to send email
        if (captureError.code === 'payment_intent_already_captured') {
          console.log('Payment was already captured, continuing...')
          paymentAlreadyCaptured = true
        } else {
          throw captureError
        }
      }
    }

    // Update booking status to confirmed
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    // Get payment method details for email
    let cardLast4: string | undefined
    let cardBrand: string | undefined
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
      if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
        cardLast4 = paymentMethod.card?.last4
        cardBrand = paymentMethod.card?.brand
      }
    } catch (stripeError) {
      console.error('Error fetching payment method details:', stripeError)
      // Continue without card details
    }

    // Generate magic link for booking access
    let magicLink: string | undefined
    if (booking.guest_email) {
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
        }
      } catch (tokenError) {
        console.error('Error generating magic link:', tokenError)
        // Continue without magic link
      }
    }

    // Send confirmation email to guest
    if (booking.guest_email) {
      console.log('📧 Preparing to send booking confirmed email to:', booking.guest_email)
      const gym = booking.gym as any
      const package_ = booking.package as any
      const variant = booking.variant as any

      try {
        await sendBookingConfirmedEmail({
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
          chargeDate: new Date().toISOString(),
          mealPlanDetails: package_?.meal_plan_details || null,
          magicLink,
        })
        console.log('✅ Booking confirmed email sent successfully')
      } catch (emailError) {
        console.error('❌ Error sending booking confirmed email:', emailError)
        // Don't fail the capture if email fails - payment is already captured
      }
    } else {
      console.warn('⚠️  No guest email found for booking, skipping confirmation email')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payment capture error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
