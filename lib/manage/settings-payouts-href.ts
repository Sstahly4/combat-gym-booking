/**
 * Partner Hub: canonical URL for payout method setup (Wise / Stripe) and
 * embedded Connect activity. Lives under Settings → Payouts (industry-standard placement).
 */
export function manageSettingsPayoutsHref(
  gymId: string | null | undefined,
  hash?: string | null
): string {
  const q = new URLSearchParams()
  q.set('tab', 'payouts')
  if (gymId) q.set('gym_id', gymId)
  const path = `/manage/settings?${q.toString()}`
  const h = hash?.replace(/^#/, '').trim()
  return h ? `${path}#${h}` : path
}
