import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLATFORM_COMMISSION_RATE } from '@/lib/stripe'
import {
  cancellationPolicyToStripeMetadata,
  resolveCancellationPolicy,
} from '@/lib/booking/cancellation-policy'
import type { GymCancellationPolicyTone } from '@/lib/booking/cancellation-policy'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const bookingId = params.id

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        gym:gyms(stripe_account_id, currency, cancellation_policy_tone),
        package:packages(cancellation_policy_days)
      `
      )
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (user && booking.user_id && booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const allowedStatuses = new Set(['pending', 'confirmed'])
    if (!allowedStatuses.has(booking.status)) {
      return NextResponse.json(
        { error: 'Booking already processed', details: `status=${booking.status}` },
        { status: 400 }
      )
    }

    const gym = booking.gym as {
      stripe_account_id: string | null
      currency: string
      cancellation_policy_tone?: string | null
    }
    const pkg = booking.package as { cancellation_policy_days: number | null } | null

    if (!stripe) {
      console.error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.'
      )
      return NextResponse.json(
        {
          error: 'Payment system is not configured. Please contact support.',
          details:
            'Stripe API key is missing or invalid. Please check your environment configuration.',
        },
        { status: 500 }
      )
    }

    const consentAt = new Date()
    const policy = resolveCancellationPolicy({
      startDate: booking.start_date,
      packageCancellationPolicyDays: pkg?.cancellation_policy_days ?? null,
      gymPolicyTone: (gym.cancellation_policy_tone as GymCancellationPolicyTone | null) ?? null,
      asOf: consentAt,
    })

    const policyMeta = cancellationPolicyToStripeMetadata(policy.snapshot)

    if (booking.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
        if (existing.client_secret && existing.status !== 'canceled') {
          await stripe.paymentIntents.update(booking.stripe_payment_intent_id, {
            metadata: {
              ...existing.metadata,
              booking_id: bookingId,
              gym_id: booking.gym_id,
              booking_reference: booking.booking_reference || '',
              platform_commission_rate: String(PLATFORM_COMMISSION_RATE),
              ...policyMeta,
            },
          })
          await supabase
            .from('bookings')
            .update({ cancellation_policy_snapshot: policy.snapshot as unknown as Record<string, unknown> })
            .eq('id', bookingId)

          return NextResponse.json({ client_secret: existing.client_secret })
        }
      } catch (e) {
        console.warn('Failed to retrieve existing payment intent, will create a new one:', e)
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_price * 100),
      currency: gym.currency.toLowerCase(),
      capture_method: 'manual',
      payment_method_types: ['card'],
      metadata: {
        booking_id: bookingId,
        gym_id: booking.gym_id,
        booking_reference: booking.booking_reference || '',
        platform_commission_rate: String(PLATFORM_COMMISSION_RATE),
        ...policyMeta,
      },
    })

    await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        cancellation_policy_snapshot: policy.snapshot as unknown as Record<string, unknown>,
      })
      .eq('id', bookingId)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create payment intent'
    console.error('Payment intent creation error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
