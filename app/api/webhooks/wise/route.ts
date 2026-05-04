import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyWiseTransferWebhookState } from '@/lib/manage/apply-wise-transfer-webhook'
import { parseWiseTransferStateChangePayload } from '@/lib/wise/parse-wise-transfer-webhook'
import { verifyWiseWebhookSignature, wiseWebhookSignatureBypassAllowed } from '@/lib/wise/wise-webhook-verify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Wise Platform webhooks (`transfers#state-change`, etc.).
 * Subscribe in Wise to this URL; verify `X-Signature-SHA256` per Wise docs.
 *
 * Completes pending `gym_platform_payouts` rows whose `external_reference`
 * equals the Wise transfer id (see admin POST with `status: "pending"`).
 *
 * Ops runbook: `docs/internal/ops-platform-payouts-runbook.md`
 * Admin UI: `/admin/platform-payouts`
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature-sha256')

  const bypass = wiseWebhookSignatureBypassAllowed()
  if (!bypass && !verifyWiseWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody) as unknown
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = parseWiseTransferStateChangePayload(json)
  if (!parsed) {
    // Acknowledge unrelated event types so Wise does not retry unnecessarily.
    return NextResponse.json({ ok: true, handled: false })
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('[webhooks/wise] admin client', e)
    return NextResponse.json({ error: 'Server configuration' }, { status: 500 })
  }

  const result = await applyWiseTransferWebhookState({
    supabase,
    transferId: parsed.transfer_id,
    currentState: parsed.current_state,
  })

  return NextResponse.json({ ok: true, handled: true, ...result })
}
