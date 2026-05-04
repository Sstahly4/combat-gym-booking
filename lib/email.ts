/**
 * Transactional booking emails.
 *
 * All user-facing HTML is composed from the primitives in `./email-layout`
 * so the CombatStay brand stays consistent across every message. To edit
 * colors, spacing, or button style, change the shared layout file — not here.
 */

import {
  APP_URL,
  BRAND,
  callout,
  cardTitle,
  checkList,
  detailRows,
  divider,
  escape,
  formatDate,
  formatMoney,
  heading,
  linkFallback,
  nightsBetween,
  numberedList,
  panel,
  paragraph,
  primaryButton,
  renderEmail,
  sectionLabel,
  sendEmail,
  uppercaseLabel,
} from './email-layout'

// ============================================================================
// Types
// ============================================================================

interface AdminBookingEmailData {
  bookingReference: string
  bookingPin: string
  gymName: string
  gymCity: string
  gymCountry: string
  gymOwnerEmail?: string
  gymOwnerName?: string
  packageName?: string
  variantName?: string
  startDate: string
  endDate: string
  duration: number
  guestName: string
  guestEmail: string
  guestPhone?: string
  discipline: string
  experienceLevel: string
  notes?: string
  totalPrice: number
  platformFee: number
  currency: string
  paymentIntentId: string
  paymentStatus: string
  cardLast4?: string
  cardBrand?: string
}

interface MealPlanDetails {
  breakfast?: boolean
  lunch?: boolean
  dinner?: boolean
  meals_per_day?: number
  description?: string
}

interface UserConfirmationEmailData {
  bookingReference: string
  bookingPin: string
  guestName: string
  guestEmail: string
  gymName: string
  gymCountry: string
  startDate: string
  endDate: string
  packageName?: string
  variantName?: string
  totalPrice: number
  currency: string
  cardLast4?: string
  cardBrand?: string
  paymentDate: string
  mealPlanDetails?: MealPlanDetails | null
  magicLink?: string
}

interface GuestBookingRequestedEmailData {
  bookingReference: string
  bookingPin: string
  guestName: string
  guestEmail: string
  gymName: string
  gymCountry: string
  startDate: string
  endDate: string
  packageName?: string
  variantName?: string
  totalPrice: number
  currency: string
  paymentLink: string
  mealPlanDetails?: MealPlanDetails | null
}

interface BookingConfirmedEmailData {
  bookingReference: string
  bookingPin: string
  guestName: string
  guestEmail: string
  gymName: string
  gymCountry: string
  startDate: string
  endDate: string
  packageName?: string
  variantName?: string
  totalPrice: number
  currency: string
  cardLast4?: string
  cardBrand?: string
  chargeDate: string
  mealPlanDetails?: MealPlanDetails | null
  magicLink?: string
}

interface BookingRequestAcceptedEmailData {
  bookingReference: string
  guestName: string
  guestEmail: string
  gymName: string
  startDate: string
  endDate: string
  totalPrice: number
  currency: string
  paymentLink: string
}

interface BookingRequestDeclinedEmailData {
  bookingReference: string
  guestName: string
  guestEmail: string
  gymName: string
  reason: string
}

// ============================================================================
// Shared helpers
// ============================================================================

function formatMealPlan(details?: MealPlanDetails | null): string {
  if (!details) return 'No meal plan included with this booking.'
  const meals: string[] = []
  if (details.breakfast) meals.push('Breakfast')
  if (details.lunch) meals.push('Lunch')
  if (details.dinner) meals.push('Dinner')
  const parts: string[] = []
  if (meals.length) parts.push(meals.join(', '))
  if (details.meals_per_day) {
    parts.push(
      `${details.meals_per_day} ${details.meals_per_day === 1 ? 'meal' : 'meals'} per day`,
    )
  }
  if (details.description) parts.push(details.description)
  return parts.length ? parts.join(' · ') : 'No meal plan included with this booking.'
}

function reservationSummary(opts: {
  gymName: string
  startDate: string
  endDate: string
  packageName?: string
  variantName?: string
}): string {
  const nights = nightsBetween(opts.startDate, opts.endDate)
  const stay = `${nights} ${nights === 1 ? 'night' : 'nights'}${opts.packageName ? ` · ${opts.packageName}` : ''}${opts.variantName ? ` — ${opts.variantName}` : ''}`
  return (
    cardTitle(opts.gymName) +
    uppercaseLabel('Reservation') +
    detailRows([
      { label: 'Check-in', value: `${escape(formatDate(opts.startDate))} <span style="color:${BRAND.metaText};">(14:00 – 23:00)</span>` },
      { label: 'Check-out', value: `${escape(formatDate(opts.endDate))} <span style="color:${BRAND.metaText};">(until 10:00)</span>` },
      { label: 'Stay', value: escape(stay) },
    ])
  )
}

function guestPanel(opts: {
  guestName: string
  mealPlanDetails?: MealPlanDetails | null
  packageName?: string
}): string {
  return (
    uppercaseLabel('Guest') +
    detailRows([
      { label: 'Name', value: escape(opts.guestName) },
      { label: 'Meal plan', value: escape(formatMealPlan(opts.mealPlanDetails)) },
      ...(opts.packageName ? [{ label: 'Package', value: escape(opts.packageName) }] : []),
    ])
  )
}

function referenceStrip(ref: string, pin?: string): string {
  const pinRow = pin
    ? `<span style="color:${BRAND.metaText};font-size:13px;margin-left:12px;">PIN <strong style="color:${BRAND.headingText};letter-spacing:1px;">${escape(pin)}</strong></span>`
    : ''
  return `<div style="margin:0 0 24px 0;padding:12px 14px;background-color:${BRAND.subtleBg};border:1px solid ${BRAND.subtleBorder};border-radius:10px;">
    <span style="color:${BRAND.metaText};font-size:13px;">Reference <strong style="color:${BRAND.headingText};font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escape(ref)}</strong></span>
    ${pinRow}
  </div>`
}

// ============================================================================
// 1. Admin booking notification (internal ops email — kept compact)
// ============================================================================

export async function sendAdminBookingEmail(data: AdminBookingEmailData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const dashboardUrl = `${APP_URL()}/admin`

  const text = `New booking request — ${data.bookingReference}

Gym:        ${data.gymName} (${data.gymCity}, ${data.gymCountry})
Owner:      ${data.gymOwnerName || 'N/A'} <${data.gymOwnerEmail || 'N/A'}>
Package:    ${data.packageName || 'N/A'}${data.variantName ? ` — ${data.variantName}` : ''}
Dates:      ${formatDate(data.startDate)} → ${formatDate(data.endDate)} (${data.duration} ${data.duration === 1 ? 'day' : 'days'})

Guest:      ${data.guestName} <${data.guestEmail}>
Phone:      ${data.guestPhone || 'Not provided'}
Discipline: ${data.discipline} (${data.experienceLevel})
${data.notes ? `Notes:      ${data.notes}\n` : ''}
Total:      ${formatMoney(data.totalPrice, data.currency)}
Platform:   ${formatMoney(data.platformFee, data.currency)}
Payout:     ${formatMoney(data.totalPrice - data.platformFee, data.currency)}
Status:     ${data.paymentStatus}
PI:         ${data.paymentIntentId}
PIN:        ${data.bookingPin}

Open: ${dashboardUrl}
`

  const innerHtml = [
    heading(`New booking request`),
    paragraph(
      `<strong>${escape(data.guestName)}</strong> just requested <strong>${escape(data.gymName)}</strong> in ${escape(data.gymCity)}, ${escape(data.gymCountry)}. Review and action below.`,
    ),
    referenceStrip(data.bookingReference, data.bookingPin),
    panel(
      uppercaseLabel('Booking') +
        detailRows([
          { label: 'Dates', value: `${escape(formatDate(data.startDate))} → ${escape(formatDate(data.endDate))} <span style="color:${BRAND.metaText};">(${data.duration} ${data.duration === 1 ? 'day' : 'days'})</span>` },
          { label: 'Package', value: escape(`${data.packageName || '—'}${data.variantName ? ` — ${data.variantName}` : ''}`) },
          { label: 'Discipline', value: `${escape(data.discipline)} <span style="color:${BRAND.metaText};">(${escape(data.experienceLevel)})</span>` },
          ...(data.notes ? [{ label: 'Notes', value: escape(data.notes) }] : []),
        ]),
    ),
    panel(
      uppercaseLabel('Gym & Guest') +
        detailRows([
          { label: 'Gym', value: `${escape(data.gymName)}<br/><span style="color:${BRAND.metaText};">${escape(data.gymCity)}, ${escape(data.gymCountry)}</span>` },
          { label: 'Owner', value: `${escape(data.gymOwnerName || 'N/A')}<br/><a href="mailto:${escape(data.gymOwnerEmail || '')}" style="color:${BRAND.linkColor};text-decoration:none;">${escape(data.gymOwnerEmail || 'N/A')}</a>` },
          { label: 'Guest', value: `${escape(data.guestName)}<br/><a href="mailto:${escape(data.guestEmail)}" style="color:${BRAND.linkColor};text-decoration:none;">${escape(data.guestEmail)}</a>${data.guestPhone ? ` · ${escape(data.guestPhone)}` : ''}` },
        ]),
    ),
    panel(
      uppercaseLabel('Payment') +
        detailRows([
          { label: 'Total', value: escape(formatMoney(data.totalPrice, data.currency)) },
          { label: 'Platform fee', value: escape(formatMoney(data.platformFee, data.currency)) },
          { label: 'Gym payout', value: escape(formatMoney(data.totalPrice - data.platformFee, data.currency)) },
          { label: 'Status', value: escape(data.paymentStatus) },
          { label: 'Payment intent', value: `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">${escape(data.paymentIntentId)}</span>` },
          ...(data.cardLast4 ? [{ label: 'Card', value: escape(`${data.cardBrand || 'Card'} •••• ${data.cardLast4}`) }] : []),
        ]),
    ),
    primaryButton(dashboardUrl, 'Open admin dashboard'),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Admin · new booking',
    title: `New booking — ${data.bookingReference}`,
    preheader: `${data.guestName} requested ${data.gymName}, ${formatDate(data.startDate)}.`,
    innerHtml,
  })

  if (!adminEmail) {
    console.warn('⚠️  ADMIN_EMAIL not set; logging admin email to console only.')
    console.log(`\n📧 [admin-booking]\n${text}\n`)
    return true
  }
  return sendEmail({
    to: adminEmail,
    subject: `New booking — ${data.bookingReference} · ${data.gymName}`,
    html,
    text,
    tag: 'admin-booking',
  })
}

// ============================================================================
// 2. Guest — booking request submitted (pre-payment receipt)
// ============================================================================
//
// Fires immediately after a booking row is created, before the guest has
// completed payment. Always sent — independent of whether the later Stripe
// authorization succeeds — so the traveler always has a record of their
// reference + PIN and a link back to complete payment if they bounced.

export async function sendGuestBookingRequestedEmail(
  data: GuestBookingRequestedEmailData,
): Promise<boolean> {
  const firstName = data.guestName.split(' ')[0] || data.guestName
  const innerHtml = [
    heading(`Hi ${escape(firstName)} — your booking request is in.`),
    paragraph(
      `We've saved your booking request for <strong>${escape(data.gymName)}</strong> in ${escape(data.gymCountry)}. Complete payment below to send the request to the gym — your card is only charged once they confirm availability.`,
    ),
    referenceStrip(data.bookingReference, data.bookingPin),
    primaryButton(data.paymentLink, `Complete payment · ${formatMoney(data.totalPrice, data.currency)}`),
    linkFallback(data.paymentLink),
    panel(
      reservationSummary({
        gymName: data.gymName,
        startDate: data.startDate,
        endDate: data.endDate,
        packageName: data.packageName,
        variantName: data.variantName,
      }),
    ),
    panel(
      uppercaseLabel('Total') +
        detailRows([
          { label: 'Price', value: `<strong>${escape(formatMoney(data.totalPrice, data.currency))}</strong>` },
          { label: 'Status', value: `<span style="color:#92400e;font-weight:600;">Awaiting payment</span>` },
        ]),
    ),
    panel(guestPanel({ guestName: data.guestName, mealPlanDetails: data.mealPlanDetails, packageName: data.packageName })),
    divider(),
    sectionLabel('What happens next'),
    numberedList([
      `Complete payment using the link above to submit your request to ${escape(data.gymName)}.`,
      `Your card is authorized — not charged — until ${escape(data.gymName)} confirms your dates (usually within 24–48 hours).`,
      `If they can't accommodate you, the hold is released and you won't be charged.`,
    ]),
    callout({
      tone: 'neutral',
      title: 'Keep your PIN private',
      bodyHtml: `Your PIN can be used to modify or cancel this booking. Don't share it by email, chat, or phone — not even with ${BRAND.name} staff.`,
    }),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Booking request',
    title: `Your ${BRAND.name} booking request · ${data.bookingReference}`,
    preheader: `Reference saved — complete payment to submit your request to ${data.gymName}.`,
    innerHtml,
  })

  const text = `Your booking request for ${data.gymName} is saved.

Reference: ${data.bookingReference}
PIN: ${data.bookingPin} (keep private)

Complete payment to submit your request:
${data.paymentLink}

Check-in:  ${formatDate(data.startDate)} (14:00–23:00)
Check-out: ${formatDate(data.endDate)} (until 10:00)
Stay:      ${nightsBetween(data.startDate, data.endDate)} ${nightsBetween(data.startDate, data.endDate) === 1 ? 'night' : 'nights'}${data.packageName ? ` · ${data.packageName}` : ''}${data.variantName ? ` — ${data.variantName}` : ''}
Guest:     ${data.guestName}
Total:     ${formatMoney(data.totalPrice, data.currency)} (awaiting payment)
Meal plan: ${formatMealPlan(data.mealPlanDetails)}

What happens next:
 1. Complete payment at the link above.
 2. Your card is AUTHORIZED, not charged — until ${data.gymName} confirms (usually 24–48h).
 3. If they can't accommodate you, the hold is released — no charge.

Keep your PIN private — it can be used to modify or cancel this booking.
`

  return sendEmail({
    to: data.guestEmail,
    subject: `Your ${BRAND.name} request at ${data.gymName} · ${data.bookingReference}`,
    html,
    text,
    tag: 'guest-booking-requested',
  })
}

// ============================================================================
// 3. Guest — booking request received (card authorized, not charged)
// ============================================================================

export async function sendUserConfirmationEmail(data: UserConfirmationEmailData): Promise<boolean> {
  const innerHtml = [
    heading(`Thanks, ${data.guestName.split(' ')[0]} — your request is in.`),
    paragraph(
      `We've sent your booking request to <strong>${escape(data.gymName)}</strong> in ${escape(data.gymCountry)}. Your card is authorized but <strong>not charged yet</strong> — we only take payment once the gym confirms.`,
    ),
    referenceStrip(data.bookingReference, data.bookingPin),
    callout({
      tone: 'warning',
      title: 'Card authorized · not charged',
      bodyHtml: `We've placed a hold for <strong>${escape(formatMoney(data.totalPrice, data.currency))}</strong>. You'll only be charged if ${escape(data.gymName)} confirms availability. If they can't accommodate you, the hold is released within a few business days — no charge.`,
    }),
    ...(data.magicLink
      ? [primaryButton(data.magicLink, 'Manage your booking')]
      : []),
    panel(
      reservationSummary({
        gymName: data.gymName,
        startDate: data.startDate,
        endDate: data.endDate,
        packageName: data.packageName,
        variantName: data.variantName,
      }),
    ),
    panel(
      uppercaseLabel('Payment') +
        detailRows([
          { label: 'Status', value: `<span style="color:#92400e;font-weight:600;">Authorized · awaiting gym confirmation</span>` },
          { label: 'Amount on hold', value: escape(formatMoney(data.totalPrice, data.currency)) },
          { label: 'Date', value: escape(formatDate(data.paymentDate)) },
          ...(data.cardLast4 ? [{ label: 'Card', value: escape(`${data.cardBrand || 'Card'} •••• ${data.cardLast4}`) }] : []),
        ]),
    ),
    panel(guestPanel({ guestName: data.guestName, mealPlanDetails: data.mealPlanDetails, packageName: data.packageName })),
    divider(),
    sectionLabel('What happens next'),
    numberedList([
      `${escape(data.gymName)} reviews your request — usually within 24–48 hours.`,
      `If confirmed, we charge your card and send a final confirmation email.`,
      `If the gym can't accommodate you, the hold is released and we'll help you find alternatives.`,
    ]),
    callout({
      tone: 'neutral',
      title: 'Keep your PIN private',
      bodyHtml: `Your PIN can be used to modify or cancel this booking. Don't share it by email, chat, or phone — not even with ${BRAND.name} staff.`,
    }),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Booking request',
    title: `Your ${BRAND.name} booking request · ${data.bookingReference}`,
    preheader: `Request sent to ${data.gymName}. Your card is authorized, not charged — we'll confirm within 24–48 hours.`,
    innerHtml,
  })

  const text = `Thanks ${data.guestName} — your booking request at ${data.gymName} is in.

Reference: ${data.bookingReference}
PIN: ${data.bookingPin} (keep private)

Your card is AUTHORIZED for ${formatMoney(data.totalPrice, data.currency)} but NOT CHARGED YET.
We'll only charge you once the gym confirms availability.

Check-in:  ${formatDate(data.startDate)} (14:00–23:00)
Check-out: ${formatDate(data.endDate)} (until 10:00)
Stay:      ${nightsBetween(data.startDate, data.endDate)} ${nightsBetween(data.startDate, data.endDate) === 1 ? 'night' : 'nights'}${data.packageName ? ` · ${data.packageName}` : ''}${data.variantName ? ` — ${data.variantName}` : ''}
Guest:     ${data.guestName}
Meal plan: ${formatMealPlan(data.mealPlanDetails)}
${data.cardLast4 ? `Card:      ${data.cardBrand || 'Card'} •••• ${data.cardLast4}\n` : ''}
What happens next:
 1. ${data.gymName} reviews your request (usually within 24–48 hours).
 2. If confirmed, we charge your card and send a final confirmation.
 3. If they can't accommodate you, the hold is released — no charge.
${data.magicLink ? `\nManage your booking: ${data.magicLink}\n` : ''}
Keep your PIN private — it can be used to modify or cancel the booking.
`

  return sendEmail({
    to: data.guestEmail,
    subject: `Your ${BRAND.name} request at ${data.gymName} · ${data.bookingReference}`,
    html,
    text,
    tag: 'guest-request-received',
  })
}

// ============================================================================
// 3. Guest — booking confirmed (card charged)
// ============================================================================

export async function sendBookingConfirmedEmail(data: BookingConfirmedEmailData): Promise<boolean> {
  const innerHtml = [
    heading(`You're confirmed — ${data.gymName} is expecting you.`),
    paragraph(
      `Good news: <strong>${escape(data.gymName)}</strong> confirmed your dates and we've charged your card. Below is everything you need for arrival.`,
    ),
    referenceStrip(data.bookingReference, data.bookingPin),
    checkList([
      `${escape(data.gymName)} is expecting you on <strong>${escape(formatDate(data.startDate))}</strong>.`,
      `Payment of <strong>${escape(formatMoney(data.totalPrice, data.currency))}</strong> successfully processed.`,
      `Full booking details available anytime via the manage link below.`,
    ]),
    ...(data.magicLink
      ? [primaryButton(data.magicLink, 'Manage your booking')]
      : []),
    panel(
      reservationSummary({
        gymName: data.gymName,
        startDate: data.startDate,
        endDate: data.endDate,
        packageName: data.packageName,
        variantName: data.variantName,
      }),
    ),
    panel(
      uppercaseLabel('Payment') +
        detailRows([
          { label: 'Status', value: `<span style="color:#065f46;font-weight:600;">Charged</span>` },
          { label: 'Amount', value: escape(formatMoney(data.totalPrice, data.currency)) },
          { label: 'Date', value: escape(formatDate(data.chargeDate)) },
          ...(data.cardLast4 ? [{ label: 'Card', value: escape(`${data.cardBrand || 'Card'} •••• ${data.cardLast4}`) }] : []),
        ]),
    ),
    panel(guestPanel({ guestName: data.guestName, mealPlanDetails: data.mealPlanDetails, packageName: data.packageName })),
    divider(),
    sectionLabel('Before you arrive'),
    numberedList([
      `Save this email — you'll need the reference if you contact the gym or us.`,
      `Check passport, visa, and insurance for your trip to ${escape(data.gymCountry)}.`,
      `Questions for the gym? Use <a href="${data.magicLink || APP_URL()}" style="color:${BRAND.linkColor};text-decoration:none;">manage your booking</a> to message them directly.`,
    ]),
    callout({
      tone: 'neutral',
      title: 'Keep your PIN private',
      bodyHtml: `Your PIN can be used to modify or cancel this booking. Never share it by email, chat, or phone.`,
    }),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Booking confirmed',
    title: `Confirmed · ${data.gymName} · ${data.bookingReference}`,
    preheader: `${data.gymName} confirmed your stay. Card charged. See details inside.`,
    innerHtml,
  })

  const text = `You're confirmed — ${data.gymName} is expecting you.

Reference: ${data.bookingReference}
PIN: ${data.bookingPin} (keep private)

Check-in:  ${formatDate(data.startDate)} (14:00–23:00)
Check-out: ${formatDate(data.endDate)} (until 10:00)
Stay:      ${nightsBetween(data.startDate, data.endDate)} ${nightsBetween(data.startDate, data.endDate) === 1 ? 'night' : 'nights'}${data.packageName ? ` · ${data.packageName}` : ''}${data.variantName ? ` — ${data.variantName}` : ''}
Guest:     ${data.guestName}
Meal plan: ${formatMealPlan(data.mealPlanDetails)}

Payment:   CHARGED ${formatMoney(data.totalPrice, data.currency)}${data.cardLast4 ? ` (${data.cardBrand || 'Card'} •••• ${data.cardLast4})` : ''} on ${formatDate(data.chargeDate)}
${data.magicLink ? `\nManage your booking: ${data.magicLink}\n` : ''}
Before you arrive:
 1. Save this email — you may need the reference on arrival.
 2. Check passport, visa, and insurance for ${data.gymCountry}.
 3. Questions for the gym? Message them via the manage link.

Keep your PIN private.
`

  return sendEmail({
    to: data.guestEmail,
    subject: `Confirmed: ${data.gymName} · ${data.bookingReference}`,
    html,
    text,
    tag: 'guest-confirmed',
  })
}

// ============================================================================
// 4. Guest — gym accepted the request (action needed: complete payment)
// ============================================================================

export async function sendBookingRequestAcceptedEmail(data: BookingRequestAcceptedEmailData): Promise<boolean> {
  const innerHtml = [
    heading(`${data.gymName} accepted your request.`),
    paragraph(
      `Hi ${escape(data.guestName.split(' ')[0])} — good news, <strong>${escape(data.gymName)}</strong> accepted your booking request. Complete payment below within <strong>48 hours</strong> to lock it in.`,
    ),
    referenceStrip(data.bookingReference),
    primaryButton(data.paymentLink, `Complete payment · ${formatMoney(data.totalPrice, data.currency)}`),
    linkFallback(data.paymentLink),
    panel(
      uppercaseLabel('Reservation') +
        detailRows([
          { label: 'Gym', value: escape(data.gymName) },
          { label: 'Check-in', value: escape(formatDate(data.startDate)) },
          { label: 'Check-out', value: escape(formatDate(data.endDate)) },
          { label: 'Total', value: `<strong>${escape(formatMoney(data.totalPrice, data.currency))}</strong>` },
        ]),
    ),
    callout({
      tone: 'warning',
      title: '48-hour window',
      bodyHtml: `If payment isn't completed within 48 hours, the gym may release your dates to other guests. Questions? Just reply to this email.`,
    }),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Action required',
    title: `${data.gymName} accepted · complete payment`,
    preheader: `${data.gymName} accepted your booking. Complete payment within 48 hours to confirm.`,
    innerHtml,
  })

  const text = `${data.gymName} accepted your booking request.

Hi ${data.guestName},

Reference: ${data.bookingReference}

Complete payment within 48 HOURS to secure your booking:
${data.paymentLink}

Check-in:  ${formatDate(data.startDate)}
Check-out: ${formatDate(data.endDate)}
Total:     ${formatMoney(data.totalPrice, data.currency)}

If payment isn't completed within 48 hours, the gym may release your dates.
Questions? Reply to this email.
`

  return sendEmail({
    to: data.guestEmail,
    subject: `${data.gymName} accepted · complete payment · ${data.bookingReference}`,
    html,
    text,
    tag: 'guest-request-accepted',
  })
}

// ============================================================================
// 5. Guest — gym declined the request
// ============================================================================

export async function sendBookingRequestDeclinedEmail(data: BookingRequestDeclinedEmailData): Promise<boolean> {
  const browseUrl = `${APP_URL()}/search`

  const innerHtml = [
    heading(`Your request couldn't be confirmed.`),
    paragraph(
      `Hi ${escape(data.guestName.split(' ')[0])} — we're sorry, <strong>${escape(data.gymName)}</strong> can't accommodate your booking at this time. No charge was made.`,
    ),
    referenceStrip(data.bookingReference),
    callout({
      tone: 'neutral',
      title: `Reason from ${data.gymName}`,
      bodyHtml: escape(data.reason),
    }),
    primaryButton(browseUrl, 'Browse similar gyms'),
    divider(),
    sectionLabel('Still want to train in the area?'),
    numberedList([
      `Try flexible dates if your schedule allows — many gyms fill up fast.`,
      `Browse other verified ${BRAND.name} gyms in the same country or region.`,
      `Reply to this email and our team will help you find alternatives.`,
    ]),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Request update',
    title: `Update on your ${data.gymName} request`,
    preheader: `${data.gymName} can't confirm your booking. No charge was made — let's find alternatives.`,
    innerHtml,
  })

  const text = `Your ${data.gymName} request couldn't be confirmed.

Hi ${data.guestName},

Reference: ${data.bookingReference}

Reason from ${data.gymName}:
${data.reason}

No charge was made.

Browse similar gyms: ${browseUrl}

Still want to train in the area?
 - Try flexible dates.
 - Browse other verified ${BRAND.name} gyms nearby.
 - Reply to this email and our team will help.
`

  return sendEmail({
    to: data.guestEmail,
    subject: `Update on your ${data.gymName} request · ${data.bookingReference}`,
    html,
    text,
    tag: 'guest-request-declined',
  })
}

// ============================================================================
// 6. Owner — payouts disabled by Stripe (action required)
// ============================================================================

export async function sendOwnerPayoutDisabledEmail(data: {
  ownerEmail: string
  gymName: string
  stripeAccountId: string
  disabledReason?: string | null
  requirementsDue?: string[]
}): Promise<boolean> {
  const dashboardUrl = `${APP_URL()}/manage/stripe-connect`
  const reason = data.disabledReason?.trim() || 'Not specified by Stripe'
  const due =
    data.requirementsDue && data.requirementsDue.length > 0
      ? data.requirementsDue.join(', ')
      : 'None listed'

  const innerHtml = [
    heading(`Payouts paused for ${data.gymName}`),
    paragraph(
      `Stripe has disabled payouts on your connected account. Your listing remains live, but earnings won't transfer until this is resolved.`,
    ),
    callout({
      tone: 'danger',
      title: 'Reason from Stripe',
      bodyHtml: escape(reason),
    }),
    primaryButton(dashboardUrl, 'Finish Stripe setup'),
    panel(
      uppercaseLabel('Account') +
        detailRows([
          { label: 'Gym', value: escape(data.gymName) },
          { label: 'Stripe account', value: `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">${escape(data.stripeAccountId)}</span>` },
          { label: 'Outstanding requirements', value: escape(due) },
        ]),
    ),
    paragraph(
      `If you didn't change your bank or identity details, reply to this email and we'll investigate with Stripe on your behalf.`,
      { muted: true },
    ),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Action required',
    title: `Payouts paused · ${data.gymName}`,
    preheader: `Stripe disabled payouts. Finish Connect setup to resume transfers.`,
    innerHtml,
  })

  const text = `Payouts paused for ${data.gymName}

Stripe has disabled payouts on your connected account (${data.stripeAccountId}).

Reason (Stripe): ${reason}
Outstanding requirements: ${due}

Finish Stripe setup:
${dashboardUrl}

If you didn't change bank or identity details, reply to this email and we'll investigate.
`

  return sendEmail({
    to: data.ownerEmail,
    subject: `Action required: payouts paused · ${data.gymName}`,
    html,
    text,
    tag: 'owner-payout-disabled',
  })
}
