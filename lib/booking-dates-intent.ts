/** Query param: user explicitly confirmed dates (picker / search / booking flow). */
export const DATES_CONFIRMED_QUERY = 'dates_confirmed' as const

export function hasConfirmedDatesInParams(
  params: { get: (name: string) => string | null }
): boolean {
  return (
    params.get(DATES_CONFIRMED_QUERY) === 'true' &&
    Boolean(params.get('checkin')) &&
    Boolean(params.get('checkout'))
  )
}

/** Build gym deep-link with dates only when the user confirmed intent. */
export function gymHrefWithOptionalDates(
  slugOrId: string,
  opts: { checkin?: string; checkout?: string; datesConfirmed?: boolean }
): string {
  const path = `/gyms/${slugOrId}`
  const { checkin, checkout, datesConfirmed } = opts
  if (!checkin || !checkout || !datesConfirmed) return path
  const qs = new URLSearchParams()
  qs.set('checkin', checkin)
  qs.set('checkout', checkout)
  qs.set(DATES_CONFIRMED_QUERY, 'true')
  return `${path}?${qs.toString()}`
}
