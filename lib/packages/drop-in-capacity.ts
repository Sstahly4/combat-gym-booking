import type { SupabaseClient } from '@supabase/supabase-js'
import { OCCUPYING_BOOKING_STATUSES } from '@/lib/booking/occupying-statuses'
import { isDropInPackage } from '@/lib/packages/drop-in'

export const DROP_IN_SOLD_OUT_ERROR =
  'This date is sold out. Please choose another visit day.'

export type DropInDayAvailability = {
  date: string
  capacity: number | null
  booked: number
  spots_left: number | null
  sold_out: boolean
}

export function isDropInDateSoldOut(
  capacity: number | null | undefined,
  booked: number
): boolean {
  if (capacity == null) return false
  return booked >= capacity
}

export function dropInSpotsLeft(
  capacity: number | null | undefined,
  booked: number
): number | null {
  if (capacity == null) return null
  return Math.max(0, capacity - booked)
}

/**
 * Count occupying drop-in bookings on a single visit date.
 * Drop-ins use start_date === end_date; each booking counts as one spot.
 */
export async function countDropInBookingsForDate(
  supabase: SupabaseClient,
  packageId: string,
  visitDate: string,
  options?: { excludeBookingId?: string | null }
): Promise<number> {
  let query = supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('package_id', packageId)
    .eq('start_date', visitDate)
    .eq('end_date', visitDate)
    .in('status', [...OCCUPYING_BOOKING_STATUSES])

  if (options?.excludeBookingId) {
    query = query.neq('id', options.excludeBookingId)
  }

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export async function assertDropInCapacityAvailable(
  supabase: SupabaseClient,
  input: {
    packageId: string
    offerType: string | null | undefined
    dailyCapacity: number | null | undefined
    visitDate: string
    excludeBookingId?: string | null
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isDropInPackage({ offer_type: input.offerType })) {
    return { ok: true }
  }

  const cap = input.dailyCapacity
  if (cap == null) {
    return { ok: true }
  }

  const booked = await countDropInBookingsForDate(
    supabase,
    input.packageId,
    input.visitDate,
    { excludeBookingId: input.excludeBookingId }
  )

  if (isDropInDateSoldOut(cap, booked)) {
    return { ok: false, error: DROP_IN_SOLD_OUT_ERROR }
  }

  return { ok: true }
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function diffDaysInclusive(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number)
  const [ty, tm, td] = toIso.split('-').map(Number)
  const a = Date.UTC(fy, fm - 1, fd)
  const b = Date.UTC(ty, tm - 1, td)
  return Math.round((b - a) / 86_400_000)
}

/** Dates a booking occupies for calendar / capacity (inclusive visit days). */
export function bookingOccupiedDates(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return []
  if (endDate < startDate) return []

  const span = diffDaysInclusive(startDate, endDate)
  // Same-day visit (drop-in): one spot on that date.
  const days = span === 0 ? 1 : span
  const dates: string[] = []
  for (let i = 0; i < days; i++) {
    dates.push(addDaysISO(startDate, i))
  }
  return dates
}

export async function getDropInAvailabilityRange(
  supabase: SupabaseClient,
  input: {
    packageId: string
    dailyCapacity: number | null | undefined
    from: string
    to: string
  }
): Promise<DropInDayAvailability[]> {
  const { packageId, dailyCapacity, from, to } = input
  const cap = dailyCapacity ?? null

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_date, end_date')
    .eq('package_id', packageId)
    .in('status', [...OCCUPYING_BOOKING_STATUSES])
    .lte('start_date', to)
    .gte('end_date', from)

  if (error) throw error

  const bookedByDate = new Map<string, number>()
  for (const row of bookings ?? []) {
    const start = row.start_date as string
    const end = row.end_date as string
    if (!start || !end) continue
    for (const d of bookingOccupiedDates(start, end)) {
      if (d < from || d > to) continue
      bookedByDate.set(d, (bookedByDate.get(d) ?? 0) + 1)
    }
  }

  const totalDays = diffDaysInclusive(from, to)
  const days: DropInDayAvailability[] = []
  for (let i = 0; i <= totalDays; i++) {
    const date = addDaysISO(from, i)
    const booked = bookedByDate.get(date) ?? 0
    const spots_left = dropInSpotsLeft(cap, booked)
    days.push({
      date,
      capacity: cap,
      booked,
      spots_left,
      sold_out: isDropInDateSoldOut(cap, booked),
    })
  }
  return days
}
