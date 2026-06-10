import { format, parseISO, set, subDays } from 'date-fns'
import type { CheckoutAccordionSection } from '@/components/booking/checkout-accordion'
import {
  resolveCancellationPolicy,
  type GymCancellationPolicyTone,
} from '@/lib/booking/cancellation-policy'

function singleSection(
  items: CheckoutAccordionSection['items'],
  footerText?: string
): CheckoutAccordionSection[] {
  return [{ items, footerText }]
}

export function getCheckoutCancellationCopy({
  checkin,
  packageCancellationPolicyDays,
  gymPolicyTone,
}: {
  checkin: string
  packageCancellationPolicyDays: number | null
  gymPolicyTone?: GymCancellationPolicyTone | null
}): {
  summary: string
  sections: CheckoutAccordionSection[]
} | null {
  if (!checkin) return null

  const days = packageCancellationPolicyDays
  const resolved = resolveCancellationPolicy({
    startDate: checkin,
    packageCancellationPolicyDays: days,
    gymPolicyTone: gymPolicyTone ?? null,
  })

  if (days == null) {
    return {
      summary: 'Non-refundable',
      sections: singleSection([
        {
          id: 'non-refundable',
          title: 'Can I cancel this booking?',
          subtitle: 'This booking is non-refundable',
          body: 'This package does not include a free cancellation window. Once you complete payment, the booking cannot be cancelled or refunded unless the gym agrees otherwise.',
        },
        {
          id: 'payment-timing',
          title: 'When is my card charged?',
          subtitle: 'Payment is authorized at checkout',
          body: 'Your card is authorized when you confirm the booking. The charge is captured according to the gym and platform payment schedule. See Full policy for how holds and refunds work.',
        },
      ]),
    }
  }

  const cutoffDate =
    days != null && checkin ? subDays(parseISO(checkin), days) : null
  const cutoffFormatted =
    cutoffDate != null
      ? format(set(cutoffDate, { hours: 23, minutes: 59, seconds: 0 }), "d MMM 'at' HH:mm")
      : null

  if (resolved.cancellationWindowOpen && cutoffFormatted) {
    return {
      summary: `Free cancellation until ${cutoffFormatted}`,
      sections: singleSection(
        [
          {
            id: 'free-cancel-window',
            title: 'When can I cancel for free?',
            subtitle: `Until ${cutoffFormatted}`,
            body: `Cancel before ${cutoffFormatted} for a full refund. The deadline is based on your check-in date and this package's cancellation policy.`,
          },
          {
            id: 'after-deadline',
            title: 'What happens after the deadline?',
            subtitle: 'This booking becomes non-refundable',
            body: `After ${cutoffFormatted}, this booking is non-refundable. If you cancel after the deadline, you will not receive a refund unless required by law or agreed by the gym.`,
          },
          {
            id: 'refund-process',
            title: 'How do refunds work?',
            subtitle: 'Full refund within the free cancellation window',
            body: 'If you cancel before the deadline, you receive a full refund of the amount paid. Refunds are returned to your original payment method and may take several business days to appear.',
          },
          {
            id: 'payment-hold',
            title: 'When is my card charged?',
            subtitle: 'Your card is held at checkout',
            body: 'Your card is authorized when you confirm the booking. For packages with free cancellation, the charge is typically captured after the cancellation window closes — so you can still cancel for a full refund before the deadline.',
          },
        ],
        'Cancel before check-in for a full refund if you are still within the free cancellation window.'
      ),
    }
  }

  if (cutoffFormatted) {
    return {
      summary: 'Non-refundable',
      sections: singleSection([
        {
          id: 'window-closed',
          title: 'Can I still cancel for free?',
          subtitle: 'The free cancellation window has passed',
          body: `The free cancellation window ended on ${cutoffFormatted}. This booking is now non-refundable.`,
        },
        {
          id: 'refund-after-close',
          title: 'Can I get a refund?',
          subtitle: 'Refunds are not available after the deadline',
          body: 'Unless required by law or agreed by the gym, cancellations after the free cancellation window are not eligible for a refund.',
        },
      ]),
    }
  }

  return {
    summary: 'Non-refundable',
    sections: singleSection([
      {
        id: 'non-refundable-fallback',
        title: 'Can I cancel this booking?',
        subtitle: 'This booking is non-refundable',
        body: 'This booking is non-refundable.',
      },
    ]),
  }
}
