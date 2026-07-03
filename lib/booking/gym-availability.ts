import type { SupabaseClient } from '@supabase/supabase-js'

export const OCCUPYING_BOOKING_STATUSES = [
  'pending',
  'gym_confirmed',
  'confirmed',
  'paid',
  'completed',
  'pending_payment',
  'pending_confirmation',
  'awaiting_approval',
] as const

export type GymDayStatus =
  | 'open'
  | 'partial'
  | 'sold_out'
  | 'closed'
  | 'unconfigured'
  | 'import_blocked'

export type CalendarReservationChip = {
  id: string
  guest_name: string | null
  booking_reference: string | null
  start_date: string
  end_date: string
  status: string
  package_variant_id: string | null
  is_arrival: boolean
  is_departure: boolean
}

export type GymDayAvailability = {
  date: string
  price: number
  price_override: number | null
  capacity: number | null
  capacity_override: number | null
  is_closed: boolean
  closed_to_arrival: boolean
  closed_to_departure: boolean
  min_stay_override: number | null
  max_stay_override: number | null
  note: string | null
  booked: number
  spots_left: number | null
  status: GymDayStatus
  import_blocked: boolean
  import_summary: string | null
  reservations: CalendarReservationChip[]
}

export type GymAvailabilityGymMeta = {
  id: string
  currency: string
  default_price: number
  default_daily_capacity: number | null
  timezone: string | null
  booking_advance_min_days: number | null
  booking_advance_max_days: number | null
}

export type GymVariantOption = {
  id: string
  name: string
  package_id: string
  package_name: string | null
}

export type CalendarImportFeedSummary = {
  id: string
  label: string
  feed_url: string
  enabled: boolean
  last_synced_at: string | null
  last_error: string | null
  block_count: number
}

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export function diffDaysISO(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number)
  const [ty, tm, td] = toIso.split('-').map(Number)
  const a = Date.UTC(fy, fm - 1, fd)
  const b = Date.UTC(ty, tm - 1, td)
  return Math.round((b - a) / 86_400_000)
}

export function todayIsoLocal(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Inclusive visit days; same-day training bookings count as one spot. */
export function bookingOccupiedDates(start: string, end: string): string[] {
  if (!start || !end || end < start) return []
  const dates: string[] = []
  let d = start
  while (d <= end) {
    dates.push(d)
    if (d === end) break
    d = addDaysISO(d, 1)
  }
  return dates
}

export function isValidDateKey(iso: string): boolean {
  return DATE_RX.test(iso)
}

type RawBooking = {
  id: string
  guest_name: string | null
  booking_reference: string | null
  start_date: string
  end_date: string
  status: string
  package_variant_id: string | null
}

function buildReservationChips(
  bookings: RawBooking[],
  date: string,
  variantFilter: string | null
): CalendarReservationChip[] {
  const chips: CalendarReservationChip[] = []
  for (const b of bookings) {
    if (variantFilter && b.package_variant_id !== variantFilter) continue
    const start = b.start_date?.slice(0, 10)
    const end = b.end_date?.slice(0, 10)
    if (!start || !end) continue
    const occupied = bookingOccupiedDates(start, end)
    if (!occupied.includes(date)) continue
    chips.push({
      id: b.id,
      guest_name: b.guest_name,
      booking_reference: b.booking_reference,
      start_date: start,
      end_date: end,
      status: b.status,
      package_variant_id: b.package_variant_id,
      is_arrival: date === start,
      is_departure: date === end,
    })
  }
  return chips
}

export async function loadGymAvailabilityRange(
  supabase: SupabaseClient,
  input: {
    gymId: string
    from: string
    to: string
    packageVariantId?: string | null
    includeVariants?: boolean
    includeImportFeeds?: boolean
    excludeBookingId?: string | null
  }
): Promise<
  | {
      ok: true
      gym: GymAvailabilityGymMeta
      days: GymDayAvailability[]
      variants: GymVariantOption[]
      import_feeds: CalendarImportFeedSummary[]
    }
  | { ok: false; error: string; status: number }
> {
  const {
    gymId,
    from,
    to,
    packageVariantId = null,
    includeVariants = false,
    includeImportFeeds = false,
    excludeBookingId = null,
  } = input

  if (!isValidDateKey(from) || !isValidDateKey(to)) {
    return { ok: false, error: 'Invalid date format', status: 400 }
  }
  const totalDays = diffDaysISO(from, to)
  if (totalDays < 0 || totalDays > 366) {
    return { ok: false, error: 'Range must be 0–366 days', status: 400 }
  }

  const { data: gym, error: gymErr } = await supabase
    .from('gyms')
    .select(
      'id, currency, price_per_day, default_daily_capacity, timezone, booking_advance_min_days, booking_advance_max_days'
    )
    .eq('id', gymId)
    .single()

  if (gymErr || !gym) {
    return { ok: false, error: 'Gym not found', status: 404 }
  }

  let packageNameById = new Map<string, string | null>()
  let packageIds: string[] = []

  if (includeVariants) {
    const { data: gymPackages } = await supabase
      .from('packages')
      .select('id, name')
      .eq('gym_id', gymId)
    packageNameById = new Map(
      (gymPackages ?? []).map((p) => [p.id, p.name as string | null])
    )
    packageIds = [...packageNameById.keys()]
  }

  const variantPromise =
    includeVariants && packageIds.length > 0
      ? supabase
          .from('package_variants')
          .select('id, name, package_id')
          .in('package_id', packageIds)
          .order('name')
      : Promise.resolve({
          data: [] as Array<{ id: string; name: string | null; package_id: string }>,
          error: null,
        })

  const importFeedsPromise = includeImportFeeds
    ? supabase
        .from('calendar_import_feeds')
        .select('id, label, feed_url, enabled, last_synced_at, last_error, package_variant_id')
        .eq('gym_id', gymId)
        .order('created_at')
    : Promise.resolve({ data: [], error: null })

  const enabledFeedsPromise = supabase
    .from('calendar_import_feeds')
    .select('id, package_variant_id')
    .eq('gym_id', gymId)
    .eq('enabled', true)

  const [ovResult, bkResult, vResult, enabledFeedsResult, importFeedsResult] =
    await Promise.all([
      supabase
        .from('gym_daily_availability')
        .select(
          'date, capacity_override, price_override, is_closed, closed_to_arrival, closed_to_departure, min_stay_override, max_stay_override, note'
        )
        .eq('gym_id', gymId)
        .gte('date', from)
        .lte('date', to),
      supabase
        .from('bookings')
        .select(
          'id, guest_name, booking_reference, start_date, end_date, status, package_variant_id'
        )
        .eq('gym_id', gymId)
        .in('status', OCCUPYING_BOOKING_STATUSES as unknown as string[])
        .lte('start_date', to)
        .gt('end_date', from),
      variantPromise,
      enabledFeedsPromise,
      importFeedsPromise,
    ])

  if (ovResult.error) {
    return { ok: false, error: 'Failed to load availability', status: 500 }
  }
  if (bkResult.error) {
    return { ok: false, error: 'Failed to load bookings', status: 500 }
  }

  const importByDate = new Map<string, string | null>()
  const enabledFeeds = (enabledFeedsResult.data ?? []) as Array<{
    id: string
    package_variant_id: string | null
  }>
  const applicableFeedIds = enabledFeeds
    .filter(
      (f) =>
        !packageVariantId ||
        f.package_variant_id == null ||
        f.package_variant_id === packageVariantId
    )
    .map((f) => f.id)

  if (applicableFeedIds.length > 0) {
    const { data: blockRows } = await supabase
      .from('calendar_import_blocks')
      .select('block_date, summary')
      .in('feed_id', applicableFeedIds)
      .gte('block_date', from)
      .lte('block_date', to)
    for (const row of blockRows ?? []) {
      const d = String((row as { block_date: string }).block_date).slice(0, 10)
      const summary = (row as { summary: string | null }).summary
      if (!importByDate.has(d)) importByDate.set(d, summary)
    }
  }

  let variants: GymVariantOption[] = []
  if (includeVariants && vResult.data) {
    variants = (vResult.data as Array<{ id: string; name: string | null; package_id: string }>).map(
      (v) => ({
        id: v.id,
        name: v.name?.trim() || 'Room',
        package_id: v.package_id,
        package_name: packageNameById.get(v.package_id) ?? null,
      })
    )
  }

  let import_feeds: CalendarImportFeedSummary[] = []
  if (includeImportFeeds && importFeedsResult.data) {
    const feedIds = (importFeedsResult.data as { id: string }[]).map((f) => f.id)
    const blockCounts = new Map<string, number>()
    if (feedIds.length > 0) {
      const { data: counts } = await supabase
        .from('calendar_import_blocks')
        .select('feed_id')
        .in('feed_id', feedIds)
      for (const c of counts ?? []) {
        const fid = (c as { feed_id: string }).feed_id
        blockCounts.set(fid, (blockCounts.get(fid) ?? 0) + 1)
      }
    }
    import_feeds = (
      importFeedsResult.data as Array<{
        id: string
        label: string
        feed_url: string
        enabled: boolean
        last_synced_at: string | null
        last_error: string | null
      }>
    ).map((f) => ({
      id: f.id,
      label: f.label,
      feed_url: f.feed_url,
      enabled: f.enabled,
      last_synced_at: f.last_synced_at,
      last_error: f.last_error,
      block_count: blockCounts.get(f.id) ?? 0,
    }))
  }

  const bookedByDate = new Map<string, number>()
  const rawBookings = (bkResult.data ?? []).filter(
    (b) => !excludeBookingId || b.id !== excludeBookingId
  )
  for (const b of rawBookings) {
    const bStart = b.start_date?.slice(0, 10)
    const bEnd = b.end_date?.slice(0, 10)
    if (!bStart || !bEnd) continue
    if (packageVariantId && b.package_variant_id !== packageVariantId) continue
    for (const d of bookingOccupiedDates(bStart, bEnd)) {
      if (d < from || d > to) continue
      bookedByDate.set(d, (bookedByDate.get(d) ?? 0) + 1)
    }
  }

  const overrideByDate = new Map<string, Record<string, unknown>>()
  for (const row of ovResult.data ?? []) {
    const r = row as { date: string }
    overrideByDate.set(r.date, row as Record<string, unknown>)
  }

  const defaultCapacity: number | null = (gym as { default_daily_capacity?: number | null })
    .default_daily_capacity ?? null
  const defaultPrice = Number((gym as { price_per_day?: number | null }).price_per_day ?? 0)

  const days: GymDayAvailability[] = []
  for (let i = 0; i <= totalDays; i++) {
    const date = addDaysISO(from, i)
    const ov = overrideByDate.get(date)
    const capacity: number | null =
      (ov?.capacity_override as number | null | undefined) ?? defaultCapacity ?? null
    const price = Number((ov?.price_override as number | null | undefined) ?? defaultPrice)
    const booked = bookedByDate.get(date) ?? 0
    const isClosed = Boolean(ov?.is_closed)
    const closedToArrival = Boolean(ov?.closed_to_arrival)
    const closedToDeparture = Boolean(ov?.closed_to_departure)
    const importBlocked = importByDate.has(date)
    const hasRestriction =
      ov?.min_stay_override != null ||
      ov?.max_stay_override != null ||
      closedToArrival ||
      closedToDeparture

    let status: GymDayStatus = 'open'
    if (isClosed || importBlocked) status = importBlocked && !isClosed ? 'import_blocked' : 'closed'
    else if (capacity == null) status = 'unconfigured'
    else if (capacity === 0 || booked >= capacity) status = 'sold_out'
    else if (booked > 0 || hasRestriction) status = 'partial'

    days.push({
      date,
      price,
      price_override: (ov?.price_override as number | null) ?? null,
      capacity,
      capacity_override: (ov?.capacity_override as number | null) ?? null,
      is_closed: isClosed,
      closed_to_arrival: closedToArrival,
      closed_to_departure: closedToDeparture,
      min_stay_override: (ov?.min_stay_override as number | null) ?? null,
      max_stay_override: (ov?.max_stay_override as number | null) ?? null,
      note: (ov?.note as string | null) ?? null,
      booked,
      spots_left: capacity == null ? null : Math.max(0, capacity - booked),
      status,
      import_blocked: importBlocked,
      import_summary: importByDate.get(date) ?? null,
      reservations: buildReservationChips(rawBookings, date, packageVariantId),
    })
  }

  return {
    ok: true,
    gym: {
      id: gym.id,
      currency: (gym as { currency: string }).currency,
      default_price: defaultPrice,
      default_daily_capacity: defaultCapacity,
      timezone: (gym as { timezone?: string | null }).timezone ?? null,
      booking_advance_min_days:
        (gym as { booking_advance_min_days?: number | null }).booking_advance_min_days ?? null,
      booking_advance_max_days:
        (gym as { booking_advance_max_days?: number | null }).booking_advance_max_days ?? null,
    },
    days,
    variants,
    import_feeds,
  }
}

export type GuestDayAvailability = {
  date: string
  available: boolean
  reason:
    | 'closed'
    | 'sold_out'
    | 'import_blocked'
    | 'no_arrival'
    | 'no_departure'
    | 'advance_window'
    | 'open'
    | 'unconfigured'
    | null
  min_stay: number | null
  max_stay: number | null
  closed_to_arrival: boolean
  closed_to_departure: boolean
  import_blocked: boolean
}

export function toGuestDayList(
  days: GymDayAvailability[],
  gym: Pick<GymAvailabilityGymMeta, 'booking_advance_min_days' | 'booking_advance_max_days'>
): GuestDayAvailability[] {
  const today = todayIsoLocal()
  const minAdvance = gym.booking_advance_min_days ?? 0
  const maxAdvance = gym.booking_advance_max_days

  return days.map((d) => {
    const daysOut = diffDaysISO(today, d.date)
    let available = true
    let reason: GuestDayAvailability['reason'] = 'open'

    if (d.is_closed) {
      available = false
      reason = 'closed'
    } else if (d.import_blocked) {
      available = false
      reason = 'import_blocked'
    } else if (d.status === 'sold_out') {
      available = false
      reason = 'sold_out'
    } else if (daysOut < minAdvance) {
      available = false
      reason = 'advance_window'
    } else if (maxAdvance != null && daysOut > maxAdvance) {
      available = false
      reason = 'advance_window'
    } else if (d.status === 'unconfigured') {
      reason = 'unconfigured'
    }

    return {
      date: d.date,
      available,
      reason,
      min_stay: d.min_stay_override,
      max_stay: d.max_stay_override,
      closed_to_arrival: d.closed_to_arrival,
      closed_to_departure: d.closed_to_departure,
      import_blocked: d.import_blocked,
    }
  })
}

export function isGuestCheckinBlocked(
  day: GuestDayAvailability | undefined,
  gym: Pick<GymAvailabilityGymMeta, 'booking_advance_min_days' | 'booking_advance_max_days'>
): boolean {
  if (!day) return false
  if (!day.available && day.reason !== 'unconfigured') return true
  if (day.closed_to_arrival) return true
  if (day.import_blocked) return true

  const today = todayIsoLocal()
  const daysOut = diffDaysISO(today, day.date)
  const minAdvance = gym.booking_advance_min_days ?? 0
  const maxAdvance = gym.booking_advance_max_days
  if (daysOut < minAdvance) return true
  if (maxAdvance != null && daysOut > maxAdvance) return true
  return false
}

export function isGuestCheckoutBlocked(day: GuestDayAvailability | undefined): boolean {
  if (!day) return false
  if (day.closed_to_departure) return true
  if (day.import_blocked) return true
  if (!day.available && (day.reason === 'closed' || day.reason === 'sold_out')) return true
  return false
}

export function validateStayAgainstAvailability(
  days: GymDayAvailability[],
  startDate: string,
  endDate: string,
  options: {
    packageMinStay: number
    packageMaxStay?: number | null
    isTraining: boolean
    gym?: Pick<GymAvailabilityGymMeta, 'booking_advance_min_days' | 'booking_advance_max_days'>
  }
): { ok: true } | { ok: false; error: string } {
  const { packageMinStay, packageMaxStay, isTraining, gym } = options
  const byDate = new Map(days.map((d) => [d.date, d]))

  if (!isTraining && endDate <= startDate) {
    return { ok: false, error: 'Checkout must be after check-in' }
  }

  const occupied = bookingOccupiedDates(startDate, endDate)
  if (occupied.length === 0) {
    return { ok: false, error: 'Invalid date range' }
  }

  const checkInDay = byDate.get(startDate)
  const checkOutDay = byDate.get(endDate)

  if (checkInDay?.closed_to_arrival) {
    return { ok: false, error: `Check-in is not available on ${startDate}` }
  }
  if (checkOutDay?.closed_to_departure) {
    return { ok: false, error: `Check-out is not available on ${endDate}` }
  }

  if (gym) {
    const today = todayIsoLocal()
    const daysOut = diffDaysISO(today, startDate)
    const minAdvance = gym.booking_advance_min_days ?? 0
    if (daysOut < minAdvance) {
      return {
        ok: false,
        error:
          minAdvance === 0
            ? 'Check-in date is not available'
            : `Book at least ${minAdvance} day${minAdvance === 1 ? '' : 's'} in advance`,
      }
    }
    if (gym.booking_advance_max_days != null && daysOut > gym.booking_advance_max_days) {
      return {
        ok: false,
        error: `Bookings can only be made up to ${gym.booking_advance_max_days} days in advance`,
      }
    }
  }

  for (const date of occupied) {
    const day = byDate.get(date)
    if (!day) continue
    if (day.is_closed) {
      return { ok: false, error: `This gym is not available on ${date}` }
    }
    if (day.import_blocked) {
      return { ok: false, error: `This date is blocked by an imported calendar (${date})` }
    }
    if (day.capacity != null && day.booked >= day.capacity) {
      return { ok: false, error: `No spots left on ${date}` }
    }
  }

  const effectiveMinStay = Math.max(packageMinStay, checkInDay?.min_stay_override ?? 1)
  const effectiveMaxStay =
    checkInDay?.max_stay_override ?? packageMaxStay ?? null

  const stayNights = isTraining ? occupied.length : diffDaysISO(startDate, endDate)

  if (stayNights < effectiveMinStay) {
    return {
      ok: false,
      error: `Minimum stay is ${effectiveMinStay} ${effectiveMinStay === 1 ? 'day' : 'days'} for these dates`,
    }
  }
  if (effectiveMaxStay != null && stayNights > effectiveMaxStay) {
    return {
      ok: false,
      error: `Maximum stay is ${effectiveMaxStay} ${effectiveMaxStay === 1 ? 'day' : 'days'} for these dates`,
    }
  }

  return { ok: true }
}
