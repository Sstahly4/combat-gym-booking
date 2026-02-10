import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { sendBookingConfirmedEmail } from '@/lib/email'

/**
 * Resend confirmation email for confirmed bookings
 * Useful when payment was captured manually in Stripe dashboard
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Only admin can resend emails
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
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

    // Only send for confirmed bookings
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Booking must be confirmed to resend confirmation email' },
        { status: 400 }
      )
    }

    if (!booking.guest_email) {
      return NextResponse.json(
        { error: 'No guest email found for this booking' },
        { status: 400 }
      )
    }

    // Get payment method details for email
    let cardLast4: string | undefined
    let cardBrand: string | undefined
    let chargeDate = new Date().toISOString()

    if (booking.stripe_payment_intent_id && stripe) {
      try {
        // Retrieve payment intent with expanded charges
        const paymentIntent = await stripe.paymentIntents.retrieve(
          booking.stripe_payment_intent_id,
          { expand: ['charges.data'] }
        )
        
        // Get charge date from payment intent
        // Charges are available as a list, need to retrieve separately if not expanded
        if (paymentIntent.latest_charge) {
          const chargeId = typeof paymentIntent.latest_charge === 'string' 
            ? paymentIntent.latest_charge 
            : paymentIntent.latest_charge.id
          
          try {
            const charge = await stripe.charges.retrieve(chargeId)
            if (charge.created) {
              chargeDate = new Date(charge.created * 1000).toISOString()
            }
          } catch (chargeError) {
            // If charge retrieval fails, use payment intent created date
            if (paymentIntent.created) {
              chargeDate = new Date(paymentIntent.created * 1000).toISOString()
            }
          }
        } else if (paymentIntent.created) {
          // Fallback to payment intent created date
          chargeDate = new Date(paymentIntent.created * 1000).toISOString()
        }

        // Get payment method details if available
        if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
          cardLast4 = paymentMethod.card?.last4
          cardBrand = paymentMethod.card?.brand
        }
      } catch (stripeError) {
        console.error('Error fetching payment method details:', stripeError)
        // Continue without card details
      }
    }

    // Generate magic link for booking access
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
      }
    } catch (tokenError) {
      console.error('Error generating magic link:', tokenError)
      // Continue without magic link
    }

    // Send confirmation email to guest
    const gym = booking.gym as any
    const package_ = booking.package as any
    const variant = booking.variant as any

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
      chargeDate,
      mealPlanDetails: package_?.meal_plan_details || null,
      magicLink,
    })

    return NextResponse.json({ success: true, message: 'Confirmation email sent' })
  } catch (error: any) {
    console.error('Error resending confirmation email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resend confirmation email' },
      { status: 500 }
    )
  }
}
