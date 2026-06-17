import { format, parseISO, set, subDays } from 'date-fns'
import type { CheckoutAccordionSection } from '@/components/booking/checkout-accordion'
import {
  resolveCancellationPolicy,
  type GymCancellationPolicyTone,
} from '@/lib/booking/cancellation-policy'
import { GUEST_ARRIVAL_ACCEPTANCE_POLICY } from '@/lib/legal/guest-arrival-policy'

const FINE_PRINT =
  'Refunds are processed within 5–10 business days to your original payment method. CombatStay handles all refunds directly — you do not need to contact the gym to get your money back.'

function singleSection(
  items: CheckoutAccordionSection['items'],
  footerText?: string
): CheckoutAccordionSection[] {
  return [{ items, footerText }]
}

function formatDeadlineDate(cutoffDate: Date): string {
  return format(set(cutoffDate, { hours: 23, minutes: 59, seconds: 0 }), "d MMMM 'at' HH:mm")
}

function formatDeadlineDateShort(cutoffDate: Date): string {
  return format(set(cutoffDate, { hours: 23, minutes: 59, seconds: 0 }), 'd MMMM')
}

function buildCancelTimelineBody(
  cutoffFormatted: string,
  cutoffDateShort: string,
  checkinFormatted: string,
  hasFreeWindow: boolean
): string {
  if (hasFreeWindow) {
    return [
      `Cancel before ${cutoffFormatted}: full refund. Your card hold is released and you are not charged.`,
      `Cancel after ${cutoffFormatted}: no refund. This booking becomes non-refundable.`,
      `Check-in is ${checkinFormatted}. These dates are based on the package you selected at checkout.`,
    ].join('\n\n')
  }

  return [
    `The free cancellation window ended on ${cutoffFormatted}.`,
    `Cancel now: no refund.`,
    `Check-in is ${checkinFormatted}.`,
  ].join('\n\n')
}

const PAYMENT_TIMING_BODY =
  'We place a hold on your card when you complete checkout — you are not charged straight away. If the gym confirms your booking, the hold stays in place until your free cancellation window closes (when your package includes one). After that window, payment is captured and CombatStay appears on your statement, not the gym.\n\nIf the gym has not confirmed yet, you are still only authorising the card — not paying the gym directly. If the gym declines, the hold is released and you are not charged.'

const GYM_CANCELS_BODY =
  'If the gym cancels or declines your booking, your card hold is released automatically. If payment was already captured, you receive a full refund — CombatStay processes this directly. You do not need to chase the gym for your money.'

const ARRIVAL_ACCEPTANCE_ITEM: CheckoutAccordionSection['items'][number] = {
  id: 'arrival-acceptance',
  title: 'What if something is wrong when I arrive?',
  subtitle: 'Report within 48 hours of check-in',
  body: GUEST_ARRIVAL_ACCEPTANCE_POLICY,
}

export function getCheckoutCancellationCopy({
  checkin,
  packageCancellationPolicyDays,
  gymPolicyTone,
  onChangeDates,
}: {
  checkin: string
  packageCancellationPolicyDays: number | null
  gymPolicyTone?: GymCancellationPolicyTone | null
  onChangeDates?: () => void
}): {
  headline: string
  summary: string
  sections: CheckoutAccordionSection[]
  finePrint: string
} | null {
  if (!checkin) return null

  const days = packageCancellationPolicyDays
  const resolved = resolveCancellationPolicy({
    startDate: checkin,
    packageCancellationPolicyDays: days,
    gymPolicyTone: gymPolicyTone ?? null,
  })

  const checkinFormatted = format(parseISO(checkin), 'd MMMM yyyy')

  const changeDatesItem = onChangeDates
    ? {
        id: 'change-dates',
        title: 'Can I change my dates instead?',
        subtitle: 'Often easier than cancelling',
        body: 'If your plans shift, you can change your dates from this booking screen before you pay. The gym sees your updated dates when they confirm. If you have already paid and need to move dates, contact Customer service with your booking reference.',
        action: { label: 'Change dates', onClick: onChangeDates },
      }
    : {
        id: 'change-dates',
        title: 'Can I change my dates instead?',
        subtitle: 'Often easier than cancelling',
        body: 'If your plans shift before check-in, changing dates is often simpler than cancelling. Contact Customer service with your booking reference if you need to move dates after payment.',
      }

  if (days == null) {
    const headline = 'Non-refundable'
    return {
      headline,
      summary: headline,
      finePrint: FINE_PRINT,
      sections: singleSection([
        {
          id: 'can-i-cancel',
          title: 'Can I cancel?',
          subtitle: 'No free cancellation window on this package',
          body: [
            'This package does not include a free cancellation period.',
            `Before check-in (${checkinFormatted}): cancellations follow the package rules — typically no refund once payment is captured.`,
            'After check-in: this booking is non-refundable.',
          ].join('\n\n'),
        },
        {
          id: 'payment-timing',
          title: 'When is my card charged?',
          subtitle: 'Authorised at checkout',
          body: PAYMENT_TIMING_BODY,
        },
        {
          id: 'gym-cancels',
          title: 'What if the gym cancels?',
          subtitle: 'Full refund automatically',
          body: GYM_CANCELS_BODY,
        },
        ARRIVAL_ACCEPTANCE_ITEM,
        changeDatesItem,
      ]),
    }
  }

  const cutoffDate =
    days != null && checkin ? subDays(parseISO(checkin), days) : null
  const cutoffFormatted =
    cutoffDate != null ? formatDeadlineDate(cutoffDate) : null
  const cutoffShort =
    cutoffDate != null ? formatDeadlineDateShort(cutoffDate) : null

  if (resolved.cancellationWindowOpen && cutoffFormatted && cutoffShort) {
    const headline = `Free cancellation until ${cutoffFormatted}`
    return {
      headline,
      summary: headline,
      finePrint: FINE_PRINT,
      sections: singleSection([
        {
          id: 'can-i-cancel',
          title: 'Can I cancel?',
          subtitle: `Full refund before ${cutoffShort}`,
          body: buildCancelTimelineBody(cutoffFormatted, cutoffShort, checkinFormatted, true),
        },
        {
          id: 'payment-timing',
          title: 'When is my card charged?',
          subtitle: 'Held now — charged after the gym confirms',
          body: PAYMENT_TIMING_BODY,
        },
        {
          id: 'gym-cancels',
          title: 'What if the gym cancels?',
          subtitle: 'Full refund automatically',
          body: GYM_CANCELS_BODY,
        },
        ARRIVAL_ACCEPTANCE_ITEM,
        changeDatesItem,
      ]),
    }
  }

  if (cutoffFormatted && cutoffShort) {
    const headline = 'Non-refundable'
    return {
      headline,
      summary: headline,
      finePrint: FINE_PRINT,
      sections: singleSection([
        {
          id: 'can-i-cancel',
          title: 'Can I cancel?',
          subtitle: 'Free cancellation window has passed',
          body: buildCancelTimelineBody(cutoffFormatted, cutoffShort, checkinFormatted, false),
        },
        {
          id: 'payment-timing',
          title: 'When is my card charged?',
          subtitle: 'Payment may already be captured',
          body: PAYMENT_TIMING_BODY,
        },
        {
          id: 'gym-cancels',
          title: 'What if the gym cancels?',
          subtitle: 'Full refund automatically',
          body: GYM_CANCELS_BODY,
        },
        ARRIVAL_ACCEPTANCE_ITEM,
        changeDatesItem,
      ]),
    }
  }

  const headline = 'Non-refundable'
  return {
    headline,
    summary: headline,
    finePrint: FINE_PRINT,
    sections: singleSection([
      {
        id: 'can-i-cancel',
        title: 'Can I cancel?',
        subtitle: headline,
        body: 'This booking is non-refundable under the package rules shown at checkout.',
      },
      ARRIVAL_ACCEPTANCE_ITEM,
      changeDatesItem,
    ]),
  }
}
