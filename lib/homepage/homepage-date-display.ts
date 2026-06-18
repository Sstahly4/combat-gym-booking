const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function formatDateForDisplay(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(`${dateString}T00:00:00`)
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  return `${day} ${month}`
}

/** TripPlanner / sport-tile date line — safe for SSR defaults when URL params are absent. */
export function buildHomepageDateDisplay(checkin?: string | null, checkout?: string | null): string {
  const today = new Date()
  const nextDay = new Date(today)
  nextDay.setDate(today.getDate() + 2)

  const finalCheckin = checkin?.trim() || today.toISOString().split('T')[0]
  const finalCheckout = checkout?.trim() || nextDay.toISOString().split('T')[0]

  return `${formatDateForDisplay(finalCheckin)}-${formatDateForDisplay(finalCheckout)}, 1 adult`
}
