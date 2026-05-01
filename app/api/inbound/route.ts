import { NextRequest, NextResponse } from 'next/server'
import { Resend, type WebhookEventPayload } from 'resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Resend inbound email webhook (`email.received`).
 * Configure in Resend → Webhooks: URL `https://www.combatstay.com/api/inbound`, event `email.received`.
 * Set `RESEND_WEBHOOK_SECRET` to the webhook signing secret from the dashboard.
 *
 * Webhook payload is metadata only; fetch body via Resend Receiving API using `data.email_id`.
 * @see https://resend.com/docs/dashboard/receiving/introduction
 */
export async function GET() {
  return NextResponse.json({ ok: true, route: 'resend-inbound' })
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  if (!webhookSecret) {
    console.error('[inbound] RESEND_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let resend: Resend
  try {
    resend = new Resend()
  } catch {
    console.error('[inbound] RESEND_API_KEY is not set')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const rawBody = await request.text()
  const id = request.headers.get('svix-id')
  const timestamp = request.headers.get('svix-timestamp')
  const signature = request.headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: 'Missing Svix signature headers' }, { status: 400 })
  }

  let event: WebhookEventPayload
  try {
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: { id, timestamp, signature },
      webhookSecret,
    })
  } catch (err) {
    console.error('[inbound] webhook verify failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (event.type === 'email.received') {
    const { data } = event
    console.info('[inbound] email.received', {
      email_id: data.email_id,
      from: data.from,
      to: data.to,
      subject: data.subject,
    })
    // TODO: fetch full content via Resend Receiving API, forward to support@, store in DB, etc.
  }

  return NextResponse.json({ received: true })
}
