/**
 * Shared HTML primitives for transactional emails.
 *
 * Design system — Booking.com-inspired, Apple-clean:
 *   - System font stack, 15px body, 24px h1, line-height 1.6
 *   - Brand band at top (#003580) with CombatStay wordmark + contextual eyebrow
 *   - Primary CTA button with the same blue, 44px tap target, 8px radius
 *   - Muted support copy in #4b5563, meta in #6b7280/#9ca3af
 *   - Single rounded card (12px) on a #f4f6f9 page background
 *   - Inline styles only (required by email clients)
 *   - Bulletproof CTA pattern (table + bgcolor) for Outlook compatibility
 *
 * Every user-facing email in the codebase should be composed from the helpers
 * in this file so that branding, colors, spacing, and CTA behavior stay in
 * lockstep. If you add a new block type, add it here rather than inlining it
 * in a sender — the goal is one place to edit when the brand evolves.
 */

export const BRAND = {
  name: 'CombatStay',
  domain: 'combatstay.com',
  tagline: 'The booking platform for combat sports gyms.',
  color: '#003580',
  colorDark: '#002a66',
  colorOnBrand: '#ffffff',
  colorMutedOnBrand: '#b9cae8',
  linkColor: '#006ce4',
  pageBg: '#f4f6f9',
  cardBg: '#ffffff',
  bodyText: '#4b5563',
  headingText: '#111827',
  metaText: '#6b7280',
  fineText: '#9ca3af',
  dividerColor: '#e5e7eb',
  subtleBg: '#f9fafb',
  subtleBorder: '#eef0f4',
}

export const APP_URL = () =>
  process.env.NEXT_PUBLIC_APP_URL || `https://www.${BRAND.domain}`

// ----------------------------------------------------------------------------
// Primitives
// ----------------------------------------------------------------------------

/** Hidden preview text that appears in inbox list views (Gmail, Apple Mail). */
export function preheader(text: string): string {
  return `<div style="display:none;font-size:1px;color:${BRAND.pageBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(text)}</div>`
}

/** Brand band at the top of every email. */
export function brandBand(eyebrow: string): string {
  return `<tr>
    <td style="background-color:${BRAND.color};padding:24px 32px;">
      <p style="margin:0;color:${BRAND.colorOnBrand};font-size:15px;font-weight:700;letter-spacing:-0.2px;">${BRAND.name}.com</p>
      <p style="margin:4px 0 0 0;color:${BRAND.colorMutedOnBrand};font-size:12px;font-weight:500;letter-spacing:0.3px;text-transform:uppercase;">${escape(eyebrow)}</p>
    </td>
  </tr>`
}

/** Main H1 used at the top of the body. */
export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px 0;color:${BRAND.headingText};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;">${escape(text)}</h1>`
}

/** Regular paragraph of body copy. */
export function paragraph(html: string, options: { muted?: boolean } = {}): string {
  const color = options.muted ? BRAND.metaText : BRAND.bodyText
  const size = options.muted ? '13px' : '15px'
  return `<p style="margin:0 0 16px 0;color:${color};font-size:${size};line-height:1.6;">${html}</p>`
}

/** Bulletproof primary CTA button. */
export function primaryButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;">
    <tr>
      <td align="center" bgcolor="${BRAND.color}" style="border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:14px 28px;color:${BRAND.colorOnBrand};background-color:${BRAND.color};font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:-0.1px;min-width:200px;text-align:center;">${escape(label)}</a>
      </td>
    </tr>
  </table>`
}

/** Secondary text link shown below the CTA as a fallback URL. */
export function linkFallback(href: string, intro = 'Or paste this link into your browser:'): string {
  return `<p style="margin:0 0 6px 0;color:${BRAND.metaText};font-size:13px;line-height:1.6;">${escape(intro)}</p>
  <p style="margin:0 0 24px 0;word-break:break-all;">
    <a href="${href}" style="color:${BRAND.linkColor};font-size:13px;text-decoration:none;">${escape(href)}</a>
  </p>`
}

/** 1px horizontal divider. */
export function divider(): string {
  return `<div style="height:1px;background-color:${BRAND.dividerColor};margin:8px 0 24px 0;"></div>`
}

/** Section subheading (used above a details block or next-steps list). */
export function sectionLabel(text: string): string {
  return `<p style="margin:0 0 12px 0;color:${BRAND.headingText};font-size:14px;font-weight:600;">${escape(text)}</p>`
}

/** Small uppercase label (used inside detail cards). */
export function uppercaseLabel(text: string): string {
  return `<p style="margin:0 0 12px 0;color:${BRAND.bodyText};font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${escape(text)}</p>`
}

/** Title row inside a details card (gym name, package name, etc.). */
export function cardTitle(text: string): string {
  return `<h3 style="margin:0 0 12px 0;color:${BRAND.headingText};font-size:17px;font-weight:700;letter-spacing:-0.2px;">${escape(text)}</h3>`
}

/** Key/value rows table inside a details card. `value` may be raw HTML. */
export function detailRows(
  rows: Array<{ label: string; value: string }>,
): string {
  const body = rows
    .map((row, i) => {
      const isLast = i === rows.length - 1
      const borderStyle = isLast ? '' : `border-bottom:1px solid ${BRAND.dividerColor};`
      return `<tr>
        <td style="padding:10px 0;${borderStyle}">
          <strong style="color:${BRAND.headingText};font-size:14px;font-weight:600;">${escape(row.label)}</strong>
          <p style="margin:4px 0 0 0;color:${BRAND.bodyText};font-size:14px;line-height:1.5;">${row.value}</p>
        </td>
      </tr>`
    })
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>`
}

/** Numbered list (used for "what happens next"). Items may be raw HTML. */
export function numberedList(items: string[]): string {
  const body = items
    .map(
      (item, i) => `<tr>
        <td style="padding:0 0 10px 0;color:${BRAND.bodyText};font-size:14px;line-height:1.6;">
          <span style="color:${BRAND.color};font-weight:700;margin-right:8px;">${i + 1}.</span>
          ${item}
        </td>
      </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>`
}

/** Check-list style bullets (used for confirmation receipts). Items are raw HTML. */
export function checkList(items: string[]): string {
  const body = items
    .map(
      (item) => `<tr>
        <td style="padding:0 0 10px 0;color:${BRAND.bodyText};font-size:14px;line-height:1.6;">
          <span style="color:${BRAND.color};font-weight:700;margin-right:8px;">✓</span>
          ${item}
        </td>
      </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>`
}

export type CalloutTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const CALLOUT_STYLES: Record<
  CalloutTone,
  { bg: string; border: string; title: string; body: string }
> = {
  neutral: { bg: BRAND.subtleBg, border: BRAND.subtleBorder, title: BRAND.headingText, body: BRAND.bodyText },
  info: { bg: '#eff6ff', border: '#bfdbfe', title: '#1e40af', body: '#1e3a8a' },
  success: { bg: '#ecfdf5', border: '#a7f3d0', title: '#065f46', body: '#064e3b' },
  warning: { bg: '#fffbeb', border: '#fde68a', title: '#92400e', body: '#78350f' },
  danger: { bg: '#fef2f2', border: '#fecaca', title: '#991b1b', body: '#7f1d1d' },
}

/** Soft callout card (for warnings, info panels, stay-safe notes). */
export function callout(opts: {
  tone?: CalloutTone
  title?: string
  bodyHtml: string
}): string {
  const s = CALLOUT_STYLES[opts.tone || 'neutral']
  const title = opts.title
    ? `<p style="margin:0 0 6px 0;color:${s.title};font-size:14px;font-weight:600;line-height:1.5;">${escape(opts.title)}</p>`
    : ''
  return `<div style="background-color:${s.bg};border:1px solid ${s.border};border-radius:10px;padding:14px 16px;margin:0 0 20px 0;">
    ${title}
    <p style="margin:0;color:${s.body};font-size:13px;line-height:1.6;">${opts.bodyHtml}</p>
  </div>`
}

/** Subtle panel (gym details, payment info, guest info). */
export function panel(innerHtml: string): string {
  return `<div style="background-color:${BRAND.subtleBg};border:1px solid ${BRAND.dividerColor};border-radius:12px;padding:20px;margin:0 0 16px 0;">${innerHtml}</div>`
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/**
 * Full-document HTML wrapper. Pass the `eyebrow` (small uppercase label in the
 * brand band), `title` used as <title>, `preheader` for inbox preview text,
 * and `innerHtml` — already-composed body blocks.
 */
export function renderEmail(opts: {
  eyebrow: string
  title: string
  preheader: string
  innerHtml: string
  /** Optional footer note appended above the standard sender line. */
  footerNote?: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${escape(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader(opts.preheader)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${BRAND.cardBg};border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(17,24,39,0.04);">
          ${brandBand(opts.eyebrow)}
          <tr>
            <td style="padding:36px 32px 8px 32px;">
              ${opts.innerHtml}
            </td>
          </tr>
          ${
            opts.footerNote
              ? `<tr><td style="padding:0 32px 24px 32px;">
                  <div style="background-color:${BRAND.subtleBg};border:1px solid ${BRAND.subtleBorder};border-radius:8px;padding:14px 16px;">
                    <p style="margin:0;color:${BRAND.bodyText};font-size:13px;line-height:1.6;">${opts.footerNote}</p>
                  </div>
                </td></tr>`
              : ''
          }
          <tr>
            <td style="padding:0 32px 32px 32px;text-align:center;">
              <p style="margin:0 0 6px 0;color:${BRAND.fineText};font-size:12px;line-height:1.5;">
                Sent by ${BRAND.name}.com — ${BRAND.tagline}
              </p>
              <p style="margin:0;color:#c0c6cf;font-size:11px;line-height:1.5;">
                © ${new Date().getFullYear()} ${BRAND.name}. Questions? Reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ----------------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------------

/** Minimal HTML-escape for user-supplied strings inserted into the template. */
export function escape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Format an ISO date as "Friday, 23 April 2026". */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Format money with currency code prefix, e.g. "THB 4,500.00". */
export function formatMoney(amount: number, currency: string): string {
  return `${currency.toUpperCase()} ${amount.toFixed(2)}`
}

/** Whole-day nights between two ISO dates. */
export function nightsBetween(startIso: string, endIso: string): number {
  return Math.max(
    0,
    Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60 * 24)),
  )
}

// ----------------------------------------------------------------------------
// Resend dispatch
// ----------------------------------------------------------------------------

/**
 * Sends an email via the Resend HTTP API, falling back to console logging when
 * `RESEND_API_KEY` is not configured (local dev). Returns `true` on success
 * (or on successful console fallback) and `false` only on a real Resend error.
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  tag?: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`\n📧 [${opts.tag || 'email'}] → ${opts.to}\nSubject: ${opts.subject}\n${opts.text}\n`)
    return true
  }
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    })
    if (res.ok) {
      console.log(`✅ [${opts.tag || 'email'}] sent to ${opts.to}`)
      return true
    }
    const errText = await res.text()
    console.error(`❌ [${opts.tag || 'email'}] Resend failed:`, res.status, errText)
    return false
  } catch (err) {
    console.error(`❌ [${opts.tag || 'email'}] threw:`, err)
    return false
  }
}
