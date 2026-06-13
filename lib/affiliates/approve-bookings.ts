import type { SupabaseClient } from '@supabase/supabase-js'
import { AFFILIATE_APPROVAL_DAYS } from '@/lib/affiliates/constants'

const TERMINAL_STATUSES = new Set(['cancelled', 'declined'])

/**
 * Move affiliate-attributed bookings from pending → approved once the
 * 14-day cancellation window has passed and the booking was not cancelled.
 */
export async function approveEligibleAffiliateBookings(supabase: SupabaseClient) {
  const cutoff = new Date(Date.now() - AFFILIATE_APPROVAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const { data: rows, error } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('affiliate_payout_status', 'pending')
    .not('affiliate_code', 'is', null)
    .lte('created_at', cutoff)

  if (error) {
    throw new Error(error.message)
  }

  const approved: string[] = []
  const skipped: string[] = []

  for (const row of rows || []) {
    if (TERMINAL_STATUSES.has(row.status)) {
      skipped.push(row.id)
      continue
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        affiliate_payout_status: 'approved',
        affiliate_approved_at: now,
      })
      .eq('id', row.id)
      .eq('affiliate_payout_status', 'pending')

    if (updateError) {
      skipped.push(row.id)
      continue
    }
    approved.push(row.id)
  }

  return { approved, skipped, total: (rows || []).length }
}
