import type { SupabaseClient } from '@supabase/supabase-js'

/** Wise transfer has left Wise to the recipient (final success for outbound). */
const TERMINAL_SUCCESS = new Set(['outgoing_payment_sent'])

/** Terminal failure / reversal — do not mark host bookings paid out. */
const TERMINAL_FAILURE = new Set(['bounced_back', 'cancelled', 'funds_refunded', 'charged_back'])

export type WiseWebhookApplyResult =
  | { action: 'ignored'; reason: string }
  | { action: 'completed'; payout_id: string; bookings_updated: number }
  | { action: 'failed'; payout_id: string }

/**
 * When a `transfers#state-change` webhook arrives, match `external_reference` on
 * a pending `gym_platform_payouts` row (set to the Wise transfer id when the
 * transfer was created), then complete the ledger or mark the batch failed.
 */
export async function applyWiseTransferWebhookState(params: {
  supabase: SupabaseClient
  transferId: string | number
  currentState: string
}): Promise<WiseWebhookApplyResult> {
  const ref = String(params.transferId).trim()
  const state = (params.currentState || '').trim().toLowerCase()
  if (!ref || !state) {
    return { action: 'ignored', reason: 'missing_transfer_or_state' }
  }

  if (!TERMINAL_SUCCESS.has(state) && !TERMINAL_FAILURE.has(state)) {
    return { action: 'ignored', reason: 'non_terminal_state' }
  }

  const { data: payout, error: findErr } = await params.supabase
    .from('gym_platform_payouts')
    .select('id, gym_id, status, metadata')
    .eq('external_reference', ref)
    .in('status', ['pending', 'processing'])
    .maybeSingle()

  if (findErr) {
    console.error('[wise-webhook] lookup payout', findErr)
    return { action: 'ignored', reason: 'db_error' }
  }
  if (!payout?.id) {
    return { action: 'ignored', reason: 'no_matching_pending_payout' }
  }

  const payoutId = payout.id as string
  const gymId = payout.gym_id as string
  const meta = (payout.metadata || {}) as { booking_ids?: unknown }
  const bookingIds = Array.isArray(meta.booking_ids)
    ? meta.booking_ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : []

  if (TERMINAL_FAILURE.has(state)) {
    const { error: failErr } = await params.supabase
      .from('gym_platform_payouts')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', payoutId)

    if (failErr) {
      console.error('[wise-webhook] mark failed', failErr)
      return { action: 'ignored', reason: 'db_error' }
    }
    return { action: 'failed', payout_id: payoutId }
  }

  if (bookingIds.length === 0) {
    console.warn('[wise-webhook] pending payout has no metadata.booking_ids', payoutId)
    const { error: completeErr } = await params.supabase
      .from('gym_platform_payouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', payoutId)
    if (completeErr) {
      console.error('[wise-webhook] complete payout only', completeErr)
      return { action: 'ignored', reason: 'db_error' }
    }
    return { action: 'completed', payout_id: payoutId, bookings_updated: 0 }
  }

  const now = new Date().toISOString()

  const { error: updPayoutErr } = await params.supabase
    .from('gym_platform_payouts')
    .update({
      status: 'completed',
      completed_at: now,
    })
    .eq('id', payoutId)

  if (updPayoutErr) {
    console.error('[wise-webhook] complete payout', updPayoutErr)
    return { action: 'ignored', reason: 'db_error' }
  }

  const { data: updatedRows, error: updBookErr } = await params.supabase
    .from('bookings')
    .update({
      platform_payout_id: payoutId,
      platform_paid_out_at: now,
      updated_at: now,
    })
    .eq('gym_id', gymId)
    .in('id', bookingIds)
    .is('platform_paid_out_at', null)
    .select('id')

  if (updBookErr) {
    console.error('[wise-webhook] update bookings', updBookErr)
    return { action: 'ignored', reason: 'db_error' }
  }

  return {
    action: 'completed',
    payout_id: payoutId,
    bookings_updated: updatedRows?.length ?? 0,
  }
}
