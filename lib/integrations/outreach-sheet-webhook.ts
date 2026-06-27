/**
 * Push newly generated claim links to the outreach Google Sheet (Apps Script doPost).
 * Best-effort: never throws; claim-link generation succeeds even if the webhook fails.
 */

export type ClaimLinkSheetWebhookPayload = {
  event: 'claim_link_generated'
  gym_name: string
  gym_id: string
  claim_url: string
  token_id: string
  expires_at: string
  generated_at: string
}

export type SheetWebhookResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' }
  | { sent: false; reason: 'http_error'; status: number; body?: string }
  | { sent: false; reason: 'network_error'; message: string }

export async function notifyOutreachSheetClaimLink(
  input: Omit<ClaimLinkSheetWebhookPayload, 'event' | 'generated_at'>,
): Promise<SheetWebhookResult> {
  const webhookUrl = process.env.OUTREACH_SHEET_WEBHOOK_URL?.trim()
  if (!webhookUrl) {
    return { sent: false, reason: 'not_configured' }
  }

  const secret = process.env.OUTREACH_SHEET_WEBHOOK_SECRET?.trim()
  const body: ClaimLinkSheetWebhookPayload & { secret?: string } = {
    event: 'claim_link_generated',
    gym_name: input.gym_name,
    gym_id: input.gym_id,
    claim_url: input.claim_url,
    token_id: input.token_id,
    expires_at: input.expires_at,
    generated_at: new Date().toISOString(),
  }
  if (secret) body.secret = secret

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('[outreach-sheet-webhook] non-OK response', res.status, text.slice(0, 200))
      return { sent: false, reason: 'http_error', status: res.status, body: text.slice(0, 200) }
    }

    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.warn('[outreach-sheet-webhook] fetch failed', message)
    return { sent: false, reason: 'network_error', message }
  }
}
