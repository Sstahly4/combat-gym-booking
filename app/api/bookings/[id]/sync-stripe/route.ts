import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { sendBookingConfirmedEmail } from '@/lib/email'

/**
 * Sync booking status with Stripe payment intent
 * Useful when payment was captured manually in Stripe dashboard
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Only admin can sync
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

    // If no payment intent ID in booking, try to find it by booking reference or ID in Stripe metadata
    if (!booking.stripe_payment_intent_id) {
      console.log('⚠️  No payment intent ID in booking, attempting to find in Stripe...')
      
      if (!stripe) {
        return NextResponse.json(
          { error: 'Stripe not configured' },
          { status: 500 }
        )
      }

      // Try to find payment intent by booking reference in metadata
      try {
        const bookingRef = booking.booking_reference || bookingId
        console.log(`🔍 Searching for payment intents with booking_reference: ${bookingRef} or booking_id: ${bookingId}`)
        
        const paymentIntents = await stripe.paymentIntents.search({
          query: `metadata['booking_reference']:'${bookingRef}' OR metadata['booking_id']:'${bookingId}'`,
          limit: 10, // Get more results to find the succeeded one
        })

        console.log(`📋 Found ${paymentIntents.data.length} payment intent(s) for this booking`)

        if (paymentIntents.data.length > 0) {
          // Log all found payment intents for debugging
          paymentIntents.data.forEach((pi, idx) => {
            console.log(`   ${idx + 1}. ${pi.id} - Status: ${pi.status}, Amount: ${pi.amount}, Created: ${new Date(pi.created * 1000).toISOString()}`)
          })

          // Prefer succeeded payment intents, then most recent
          const succeededIntents = paymentIntents.data.filter(pi => pi.status === 'succeeded')
          const foundPaymentIntent = succeededIntents.length > 0 
            ? succeededIntents[0] // Use first succeeded
            : paymentIntents.data.sort((a, b) => b.created - a.created)[0] // Or most recent

          console.log(`✅ Using payment intent: ${foundPaymentIntent.id} (Status: ${foundPaymentIntent.status})`)
          
          // Update booking with payment intent ID
          await supabase
            .from('bookings')
            .update({ stripe_payment_intent_id: foundPaymentIntent.id })
            .eq('id', bookingId)
          
          // Use the found payment intent
          booking.stripe_payment_intent_id = foundPaymentIntent.id
        } else {
          return NextResponse.json(
            { error: 'No payment intent found for this booking. Please ensure the payment was created through the booking system.' },
            { status: 400 }
          )
        }
      } catch (searchError: any) {
        console.error('Error searching for payment intent:', searchError)
        return NextResponse.json(
          { error: `No payment intent found for this booking. Error: ${searchError.message}` },
          { status: 400 }
        )
      }
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    // Check payment intent status in Stripe
    console.log(`🔍 Retrieving payment intent: ${booking.stripe_payment_intent_id}`)
    let paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
    
    console.log(`📊 Payment Intent Details:`)
    console.log(`   ID: ${paymentIntent.id}`)
    console.log(`   Status: ${paymentIntent.status}`)
    console.log(`   Amount: ${paymentIntent.amount}`)
    console.log(`   Currency: ${paymentIntent.currency}`)
    console.log(`   Created: ${new Date(paymentIntent.created * 1000).toISOString()}`)
    console.log(`   Charges: ${paymentIntent.charges?.data?.length || 0}`)
    if (paymentIntent.charges?.data?.[0]) {
      console.log(`   Charge Status: ${paymentIntent.charges.data[0].status}`)
      console.log(`   Charge Captured: ${paymentIntent.charges.data[0].captured}`)
    }

    // Check if payment is succeeded OR if there's a successful charge
    const hasSuccessfulCharge = paymentIntent.charges?.data?.some(charge => 
      charge.status === 'succeeded' && charge.captured === true
    )

    // If current payment intent is not succeeded, try to find a succeeded one
    if (paymentIntent.status !== 'succeeded' && !hasSuccessfulCharge) {
      console.log(`⚠️  Payment intent ${paymentIntent.id} status is ${paymentIntent.status}, checking for other payment intents...`)
      
      // Try to find a succeeded payment intent
      try {
        const bookingRef = booking.booking_reference || bookingId
        const allIntents = await stripe.paymentIntents.search({
          query: `metadata['booking_reference']:'${bookingRef}' OR metadata['booking_id']:'${bookingId}'`,
          limit: 10,
        })

        console.log(`📋 Found ${allIntents.data.length} total payment intent(s) for this booking`)
        allIntents.data.forEach((pi, idx) => {
          console.log(`   ${idx + 1}. ${pi.id} - Status: ${pi.status}, Amount: ${pi.amount}, Created: ${new Date(pi.created * 1000).toISOString()}`)
        })

        const succeededIntent = allIntents.data.find(pi => pi.status === 'succeeded')
        if (succeededIntent) {
          console.log(`✅ Found succeeded payment intent: ${succeededIntent.id}, using that instead`)
          // Update booking with the succeeded payment intent ID
          await supabase
            .from('bookings')
            .update({ stripe_payment_intent_id: succeededIntent.id })
            .eq('id', bookingId)
          
          // Use the succeeded payment intent
          paymentIntent = succeededIntent
          console.log(`✅ Now using payment intent: ${paymentIntent.id} with status: ${paymentIntent.status}`)
        } else {
          return NextResponse.json({
            synced: false,
            stripe_status: paymentIntent.status,
            booking_status: booking.status,
            payment_intent_id: paymentIntent.id,
            searched_intents: allIntents.data.length,
            message: `Payment intent status is ${paymentIntent.status}, not succeeded. Searched ${allIntents.data.length} payment intent(s) but none are succeeded. If you manually captured this payment, please verify the payment intent ID in Stripe matches the one you captured.`
          })
        }
      } catch (searchError: any) {
        console.error('Error searching for succeeded payment intent:', searchError)
        return NextResponse.json({
          synced: false,
          stripe_status: paymentIntent.status,
          booking_status: booking.status,
          payment_intent_id: paymentIntent.id,
          message: `Payment intent status is ${paymentIntent.status}, not succeeded. Error searching for other intents: ${searchError.message}`
        })
      }
    }

    // At this point, paymentIntent should be succeeded
    if (paymentIntent.status !== 'succeeded' && !hasSuccessfulCharge) {
      return NextResponse.json({
        synced: false,
        stripe_status: paymentIntent.status,
        booking_status: booking.status,
        payment_intent_id: paymentIntent.id,
        message: `Payment intent status is ${paymentIntent.status}, not succeeded.`
      })
    }

    // Payment is succeeded in Stripe, update booking if needed
    // Allow syncing from any status (pending_payment, pending_confirmation, etc.)
    if (booking.status === 'confirmed') {
      return NextResponse.json({
        synced: true,
        already_confirmed: true,
        message: 'Booking is already confirmed'
      })
    }

    // Update booking status to confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      )
    }

    console.log(`✅ Booking status synced to confirmed: ${bookingId}`)

    // Get payment method details for email
    let cardLast4: string | undefined
    let cardBrand: string | undefined
    let chargeDate = new Date().toISOString()

    try {
      // Get charge date from payment intent
      if (paymentIntent.charges?.data?.[0]?.created) {
        chargeDate = new Date(paymentIntent.charges.data[0].created * 1000).toISOString()
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
    let emailSent = false
    if (booking.guest_email) {
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
          chargeDate,
          mealPlanDetails: package_?.meal_plan_details || null,
          magicLink,
        })
        emailSent = true
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
      }
    }

    return NextResponse.json({
      synced: true,
      status_updated: true,
      email_sent: emailSent,
      message: 'Booking status synced with Stripe and confirmation email sent'
    })
  } catch (error: any) {
    console.error('Error syncing booking with Stripe:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync booking with Stripe' },
      { status: 500 }
    )
  }
}
