/**
 * Owner-facing partner-hub notification emails.
 *
 * These complement the in-app `owner_notifications` rows so owners hear about
 * activity even when they're not logged in. They share the same design system
 * as the guest-facing booking emails — see `./email-layout` for primitives.
 */

import {
  APP_URL,
  BRAND,
  callout,
  detailRows,
  divider,
  escape,
  formatDate,
  formatMoney,
  heading,
  numberedList,
  panel,
  paragraph,
  primaryButton,
  renderEmail,
  sectionLabel,
  sendEmail,
  uppercaseLabel,
} from './email-layout'

const notificationsFooter = () =>
  `You're receiving this because email notifications are enabled for your owner account. <a href="${APP_URL()}/manage/settings?tab=communications" style="color:${BRAND.linkColor};text-decoration:none;">Manage preferences</a>.`

// ============================================================================
// Booking created (new request arrived)
// ============================================================================

export async function sendOwnerBookingCreatedEmail(data: {
  ownerEmail: string
  gymName: string
  bookingReference: string
  guestName: string
  startDate: string
  endDate: string
  totalPrice?: number
  currency?: string
}): Promise<boolean> {
  const dashboard = `${APP_URL()}/manage/bookings?ref=${encodeURIComponent(data.bookingReference)}`
  const payoutLine =
    data.totalPrice && data.currency
      ? formatMoney(data.totalPrice, data.currency)
      : null

  const innerHtml = [
    heading(`New booking request for ${data.gymName}`),
    paragraph(
      `<strong>${escape(data.guestName)}</strong> has requested ${escape(formatDate(data.startDate))} → ${escape(formatDate(data.endDate))}. The guest's card is authorized — accept or decline from the Partner Hub.`,
    ),
    primaryButton(dashboard, 'Open in Partner Hub'),
    panel(
      uppercaseLabel('Request') +
        detailRows([
          { label: 'Guest', value: escape(data.guestName) },
          { label: 'Stay', value: `${escape(formatDate(data.startDate))} → ${escape(formatDate(data.endDate))}` },
          { label: 'Reference', value: `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">${escape(data.bookingReference)}</span>` },
          ...(payoutLine ? [{ label: 'Estimated payout', value: `<strong>${escape(payoutLine)}</strong> <span style="color:${BRAND.metaText};">(after fees)</span>` }] : []),
        ]),
    ),
    divider(),
    paragraph(
      `Respond within 24 hours for the best guest experience. Guests are notified instantly whether you accept or decline.`,
      { muted: true },
    ),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner hub',
    title: `New request · ${data.gymName}`,
    preheader: `${data.guestName} requested ${formatDate(data.startDate)} — ${formatDate(data.endDate)}. Accept or decline from Partner Hub.`,
    innerHtml,
    footerNote: notificationsFooter(),
  })

  const text = `New booking request for ${data.gymName}

Guest:     ${data.guestName}
Stay:      ${formatDate(data.startDate)} → ${formatDate(data.endDate)}
Reference: ${data.bookingReference}
${payoutLine ? `Payout:    ${payoutLine} (after fees)\n` : ''}
Review and respond in Partner Hub:
${dashboard}

Respond within 24 hours for the best guest experience.
`

  return sendEmail({
    to: data.ownerEmail,
    subject: `New request · ${data.gymName} · ${data.bookingReference}`,
    html,
    text,
    tag: 'owner-booking-created',
  })
}

// ============================================================================
// Booking cancelled
// ============================================================================

export async function sendOwnerBookingCancelledEmail(data: {
  ownerEmail: string
  gymName: string
  bookingReference: string
  guestName: string
  startDate: string
  endDate: string
  reason?: string
}): Promise<boolean> {
  const dashboard = `${APP_URL()}/manage/bookings?ref=${encodeURIComponent(data.bookingReference)}`

  const innerHtml = [
    heading(`Booking cancelled · ${data.gymName}`),
    paragraph(
      `${escape(data.guestName)}'s booking has been cancelled. Any card authorization will be released automatically — no action needed from you.`,
    ),
    ...(data.reason
      ? [
          callout({
            tone: 'neutral',
            title: 'Cancellation reason',
            bodyHtml: escape(data.reason),
          }),
        ]
      : []),
    primaryButton(dashboard, 'View in Partner Hub'),
    panel(
      uppercaseLabel('Cancelled booking') +
        detailRows([
          { label: 'Guest', value: escape(data.guestName) },
          { label: 'Stay', value: `${escape(formatDate(data.startDate))} → ${escape(formatDate(data.endDate))}` },
          { label: 'Reference', value: `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">${escape(data.bookingReference)}</span>` },
        ]),
    ),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner hub',
    title: `Cancelled · ${data.gymName}`,
    preheader: `${data.guestName}'s booking was cancelled. No action needed.`,
    innerHtml,
    footerNote: notificationsFooter(),
  })

  const text = `Booking cancelled — ${data.gymName}

Guest:     ${data.guestName}
Stay:      ${formatDate(data.startDate)} → ${formatDate(data.endDate)}
Reference: ${data.bookingReference}
${data.reason ? `Reason:    ${data.reason}\n` : ''}
Any card hold will be released automatically — no action needed.

View in Partner Hub:
${dashboard}
`

  return sendEmail({
    to: data.ownerEmail,
    subject: `Cancelled · ${data.gymName} · ${data.bookingReference}`,
    html,
    text,
    tag: 'owner-booking-cancelled',
  })
}

// ============================================================================
// Review posted
// ============================================================================

export async function sendOwnerReviewPostedEmail(data: {
  ownerEmail: string
  gymName: string
  rating: number
  comment?: string | null
}): Promise<boolean> {
  const dashboard = `${APP_URL()}/manage/reviews`
  const rating = Math.max(0, Math.min(5, Math.round(data.rating)))
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)

  const innerHtml = [
    heading(`New ${rating}-star review for ${data.gymName}`),
    paragraph(
      `A guest just left feedback. Reviews are one of the strongest signals future guests look at — reply to thank them or address concerns.`,
    ),
    panel(
      `<p style="margin:0 0 8px 0;color:${BRAND.metaText};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Guest rating</p>
       <p style="margin:0 0 ${data.comment ? '12px' : '0'} 0;color:${BRAND.color};font-size:24px;letter-spacing:4px;line-height:1;">${stars}</p>
       ${data.comment ? `<p style="margin:0;color:${BRAND.bodyText};font-size:15px;line-height:1.6;font-style:italic;">\u201c${escape(data.comment)}\u201d</p>` : ''}`,
    ),
    primaryButton(dashboard, 'Reply in Partner Hub'),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner hub',
    title: `${rating}-star review · ${data.gymName}`,
    preheader: data.comment
      ? `\u201c${String(data.comment).slice(0, 100)}${String(data.comment).length > 100 ? '…' : ''}\u201d`
      : `Your gym just received a new ${rating}-star review.`,
    innerHtml,
    footerNote: notificationsFooter(),
  })

  const text = `New ${rating}-star review for ${data.gymName}

${stars}
${data.comment ? `\n"${data.comment}"\n` : ''}
Reply in Partner Hub:
${dashboard}
`

  return sendEmail({
    to: data.ownerEmail,
    subject: `${rating}-star review · ${data.gymName}`,
    html,
    text,
    tag: 'owner-review-posted',
  })
}

// ============================================================================
// Payout paid
// ============================================================================

export async function sendOwnerPayoutPaidEmail(data: {
  ownerEmail: string
  gymName: string
  amount: number
  currency: string
  arrivalDate: string
  payoutId: string
}): Promise<boolean> {
  const dashboard = `${APP_URL().replace(/\/$/, '')}/manage/settings?tab=payouts`
  const formatted = formatMoney(data.amount, data.currency)

  const innerHtml = [
    heading(`Payout sent · ${formatted}`),
    paragraph(
      `Stripe has issued a payout for <strong>${escape(data.gymName)}</strong>. Funds typically land in 1–3 business days depending on your bank.`,
    ),
    primaryButton(dashboard, 'View payouts'),
    panel(
      uppercaseLabel('Payout') +
        detailRows([
          { label: 'Amount', value: `<strong>${escape(formatted)}</strong>` },
          { label: 'Expected arrival', value: escape(formatDate(data.arrivalDate)) },
          { label: 'Payout ID', value: `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">${escape(data.payoutId)}</span>` },
        ]),
    ),
    divider(),
    sectionLabel('Good to know'),
    numberedList([
      `You can reconcile every payout against its underlying bookings in <a href="${dashboard}" style="color:${BRAND.linkColor};text-decoration:none;">Payouts</a>.`,
      `Tax documents (where applicable) are generated automatically at year-end.`,
      `Bank changes are made directly in Stripe via the Partner Hub — never share account details by email.`,
    ]),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner hub',
    title: `Payout sent · ${formatted}`,
    preheader: `${formatted} is on its way to your bank (arrival ${formatDate(data.arrivalDate)}).`,
    innerHtml,
    footerNote: notificationsFooter(),
  })

  const text = `Payout sent — ${data.gymName}

Amount:         ${formatted}
Expected arrival: ${formatDate(data.arrivalDate)}
Payout ID:      ${data.payoutId}

View payouts:
${dashboard}
`

  return sendEmail({
    to: data.ownerEmail,
    subject: `Payout sent · ${data.gymName} · ${formatted}`,
    html,
    text,
    tag: 'owner-payout-paid',
  })
}
