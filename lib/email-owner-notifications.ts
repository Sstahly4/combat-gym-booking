/**
 * Lightweight owner-notification emails.
 *
 * These complement the in-app `owner_notifications` rows so owners hear about
 * activity even when they're not logged in. Kept separate from `lib/email.ts`
 * to avoid bloating the booking-flow emails file.
 *
 * Each helper follows the same Resend HTTP-API pattern as `lib/email.ts` and
 * falls back to console logging when RESEND_API_KEY is not configured.
 */

const RESEND_URL = 'https://api.resend.com/emails'

async function sendViaResend(opts: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`\n📧 OWNER NOTIFICATION EMAIL (would send to ${opts.to}): ${opts.subject}\n${opts.text}\n`)
    return true
  }
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        ...(opts.html ? { html: opts.html } : {}),
      }),
    })
    if (res.ok) {
      console.log(`✅ Owner notification email sent to ${opts.to}: ${opts.subject}`)
      return true
    }
    console.error('❌ Resend owner-notification email failed:', res.status, await res.text())
    return false
  } catch (err) {
    console.error('❌ Owner notification email threw:', err)
    return false
  }
}

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function shellHtml(opts: { heading: string; lead: string; body: string; ctaLabel?: string; ctaHref?: string }): string {
  const cta = opts.ctaHref && opts.ctaLabel
    ? `<p style="margin: 24px 0 8px 0;">
         <a href="${opts.ctaHref}" style="display: inline-block; background-color: #003580; color: #ffffff; padding: 10px 18px; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 600;">${opts.ctaLabel}</a>
       </p>`
    : ''
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#003580;color:#ffffff;padding:18px 24px;">
          <span style="font-size:14px;letter-spacing:0.04em;text-transform:uppercase;opacity:0.85;">CombatBooking.com</span>
          <div style="font-size:20px;font-weight:700;margin-top:2px;">Partner Hub</div>
        </td></tr>
        <tr><td style="padding:28px 28px 8px 28px;">
          <h1 style="margin:0;color:#1a1a1a;font-size:20px;line-height:1.3;">${opts.heading}</h1>
          <p style="margin:8px 0 16px 0;color:#4b5563;font-size:14px;line-height:1.5;">${opts.lead}</p>
          ${opts.body}
          ${cta}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 24px;color:#6b7280;font-size:11px;text-align:center;">
          You receive these messages because notifications are enabled for your owner account.
          <br/><a href="${APP_URL()}/manage/settings/notifications" style="color:#003580;text-decoration:none;">Manage email preferences</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

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
  const priceLine = data.totalPrice && data.currency
    ? `Estimated payout (after fees): ${data.currency} ${data.totalPrice.toFixed(2)}`
    : ''
  const text = `New booking request for ${data.gymName}

Guest: ${data.guestName}
Dates: ${data.startDate} → ${data.endDate}
Reference: ${data.bookingReference}
${priceLine}

Review and respond:
${dashboard}
`
  const html = shellHtml({
    heading: `New booking request — ${data.gymName}`,
    lead: `${data.guestName} just requested ${data.startDate} → ${data.endDate}.`,
    body: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:0;">
      <tr><td style="padding:14px 16px;font-size:13px;color:#374151;">
        <strong>Reference:</strong> ${data.bookingReference}<br/>
        <strong>Guest:</strong> ${data.guestName}<br/>
        <strong>Stay:</strong> ${data.startDate} → ${data.endDate}
        ${priceLine ? `<br/><strong>${priceLine}</strong>` : ''}
      </td></tr>
    </table>`,
    ctaLabel: 'Open in Partner Hub',
    ctaHref: dashboard,
  })
  return sendViaResend({
    to: data.ownerEmail,
    subject: `New booking request for ${data.gymName} (${data.bookingReference})`,
    text,
    html,
  })
}

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
  const text = `Booking cancelled for ${data.gymName}

Guest: ${data.guestName}
Dates: ${data.startDate} → ${data.endDate}
Reference: ${data.bookingReference}
${data.reason ? `Reason: ${data.reason}\n` : ''}
View details:
${dashboard}
`
  const html = shellHtml({
    heading: `Booking cancelled — ${data.gymName}`,
    lead: `${data.guestName}\u2019s booking has been cancelled.`,
    body: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
      <tr><td style="padding:14px 16px;font-size:13px;color:#7f1d1d;">
        <strong>Reference:</strong> ${data.bookingReference}<br/>
        <strong>Stay:</strong> ${data.startDate} → ${data.endDate}
        ${data.reason ? `<br/><strong>Reason:</strong> ${data.reason}` : ''}
      </td></tr>
    </table>`,
    ctaLabel: 'Open in Partner Hub',
    ctaHref: dashboard,
  })
  return sendViaResend({
    to: data.ownerEmail,
    subject: `Booking cancelled — ${data.gymName} (${data.bookingReference})`,
    text,
    html,
  })
}

export async function sendOwnerReviewPostedEmail(data: {
  ownerEmail: string
  gymName: string
  rating: number
  comment?: string | null
}): Promise<boolean> {
  const dashboard = `${APP_URL()}/manage/reviews`
  const stars = '★'.repeat(Math.max(0, Math.min(5, data.rating))) + '☆'.repeat(Math.max(0, 5 - data.rating))
  const text = `New ${data.rating}-star review for ${data.gymName}

${stars}
${data.comment ? `\n"${data.comment}"\n` : ''}
View all reviews:
${dashboard}
`
  const html = shellHtml({
    heading: `${data.rating}-star review for ${data.gymName}`,
    lead: `A guest just left feedback for your gym.`,
    body: `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;font-size:14px;color:#78350f;">
      <div style="font-size:18px;letter-spacing:2px;">${stars}</div>
      ${data.comment ? `<p style="margin:10px 0 0 0;font-style:italic;">\u201c${data.comment}\u201d</p>` : ''}
    </div>`,
    ctaLabel: 'Open Reviews',
    ctaHref: dashboard,
  })
  return sendViaResend({
    to: data.ownerEmail,
    subject: `New ${data.rating}-star review for ${data.gymName}`,
    text,
    html,
  })
}

export async function sendOwnerPayoutPaidEmail(data: {
  ownerEmail: string
  gymName: string
  amount: number
  currency: string
  arrivalDate: string
  payoutId: string
}): Promise<boolean> {
  const dashboard = `${APP_URL()}/manage/balances/payouts`
  const formatted = `${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`
  const text = `Payout sent for ${data.gymName}

Amount: ${formatted}
Expected arrival: ${data.arrivalDate}
Payout ID: ${data.payoutId}

View payouts:
${dashboard}
`
  const html = shellHtml({
    heading: `Payout sent — ${formatted}`,
    lead: `Stripe has issued a payout for ${data.gymName}.`,
    body: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
      <tr><td style="padding:14px 16px;font-size:13px;color:#0c4a6e;">
        <strong>Amount:</strong> ${formatted}<br/>
        <strong>Expected arrival:</strong> ${data.arrivalDate}<br/>
        <strong>Payout ID:</strong> ${data.payoutId}
      </td></tr>
    </table>`,
    ctaLabel: 'Open Payouts',
    ctaHref: dashboard,
  })
  return sendViaResend({
    to: data.ownerEmail,
    subject: `Payout sent — ${data.gymName} (${formatted})`,
    text,
    html,
  })
}
