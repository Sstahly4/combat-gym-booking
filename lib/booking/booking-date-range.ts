/** Treat a lone check-in tap as a single-day booking (check-in === check-out). */
export function normalizeBookingCheckout(checkin: string, checkout: string): string {
  if (!checkin) return checkout
  if (!checkout) return checkin
  return checkout
}

export function formatBookingDateRange(from: string, to: string): string {
  if (!from) return 'No dates selected'

  const checkout = normalizeBookingCheckout(from, to)
  const start = new Date(from + 'T00:00:00')
  const end = new Date(checkout + 'T00:00:00')

  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    const month = start.toLocaleDateString('en-GB', { month: 'long' })
    const year = start.getFullYear()
    return `${start.getDate()}–${end.getDate()} ${month} ${year}`
  }

  return `${start.getDate()} ${start.toLocaleDateString('en-GB', { month: 'long' })} – ${end.getDate()} ${end.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
}
