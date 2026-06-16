/** API + client error token when a pending checkout's check-in date is in the past. */
export const BOOKING_DATES_EXPIRED_ERROR =
  'This booking is no longer available. The selected dates have passed. Please choose new dates to continue.'

export const BOOKING_DATES_EXPIRED_INLINE = 'Dates no longer available'

export const BOOKING_DATES_EXPIRED_HEADING = 'Your dates are no longer available'

export const BOOKING_DATES_EXPIRED_DESCRIPTION =
  'Update your training dates to continue with this booking.'

export const BOOKING_DATES_EXPIRED_LISTING_LINK = 'Go to listing'

export function isBookingDatesExpiredError(error: string | null | undefined): boolean {
  return error === BOOKING_DATES_EXPIRED_ERROR
}

/** Parse a yyyy-MM-dd booking day as local midnight (matches checkout date pickers). */
export function parseBookingDay(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`)
}

/** Start of the calendar day for `now` in the runtime's local timezone. */
export function startOfLocalDay(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** True when check-in is strictly before today (past dates are not bookable). */
export function isBookingStartDateInPast(
  startDate: string,
  now: Date = new Date()
): boolean {
  if (!startDate) return false
  const today = startOfLocalDay(now)
  const checkin = parseBookingDay(startDate)
  return checkin < today
}
