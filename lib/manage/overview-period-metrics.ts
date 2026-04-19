import { addDays, differenceInCalendarDays } from 'date-fns'
import { toCanonicalBookingStatus } from '@/lib/bookings/status-normalization'

const PAID = new Set(['paid', 'confirmed', 'completed'])

export type OverviewCardId =
  | 'gross_volume'
  | 'new_customers'
  | 'successful_payments'
  | 'net_volume'
  | 'payments'
  | 'failed_payments'

export interface OverviewCardModel {
  id: OverviewCardId
  label: string
  valueType: 'money' | 'count'
  currentTotal: number
  previousTotal: number
  dailyCurrent: number[]
  dailyPrevious: number[]
  rangeLabelStart: string
  rangeLabelEnd: string
  /** Short date labels for each day index 0..6 (current 7-day window). */
  tooltipDayLabelsCurrent: string[]
  /** Same indices for the prior 7-day window. */
  tooltipDayLabelsPrevious: string[]
}

function localDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dayIndexInWindow(createdAt: string, windowStart: Date): number | null {
  const t = new Date(createdAt)
  const tDay = localDateOnly(t)
  const idx = differenceInCalendarDays(tDay, windowStart)
  if (idx < 0 || idx > 6) return null
  return idx
}

function buildDailyAndTotal(
  bookings: Array<{ status: string; total_price: number | null; created_at: string }>,
  windowStart: Date,
  id: OverviewCardId
): { daily: number[]; total: number } {
  const daily = [0, 0, 0, 0, 0, 0, 0]
  for (const b of bookings) {
    const idx = dayIndexInWindow(b.created_at, windowStart)
    if (idx === null) continue
    let inc = 0
    switch (id) {
      case 'gross_volume':
        if (!PAID.has(b.status)) continue
        inc = Number(b.total_price) || 0
        break
      case 'new_customers':
        if (toCanonicalBookingStatus(b.status) === 'cancelled') continue
        inc = 1
        break
      case 'successful_payments':
        if (!PAID.has(b.status)) continue
        inc = 1
        break
      case 'net_volume':
        if (b.status !== 'completed') continue
        inc = Number(b.total_price) || 0
        break
      case 'payments':
        inc = 1
        break
      case 'failed_payments':
        if (toCanonicalBookingStatus(b.status) !== 'declined') continue
        inc = 1
        break
      default:
        continue
    }
    daily[idx] += inc
  }
  const total = daily.reduce((a, s) => a + s, 0)
  return { daily, total }
}

function formatRangeDay(d: Date): string {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

const CARD_ORDER: OverviewCardId[] = [
  'gross_volume',
  'new_customers',
  'successful_payments',
  'net_volume',
  'payments',
  'failed_payments',
]

const LABELS: Record<OverviewCardId, string> = {
  gross_volume: 'Gross volume',
  new_customers: 'New customers',
  successful_payments: 'Successful payments',
  net_volume: 'Net volume',
  payments: 'Payments',
  failed_payments: 'Failed payments',
}

const VALUE_TYPES: Record<OverviewCardId, 'money' | 'count'> = {
  gross_volume: 'money',
  new_customers: 'count',
  successful_payments: 'count',
  net_volume: 'money',
  payments: 'count',
  failed_payments: 'count',
}

/** Short explanations for dashboard overview cards (hover / assistive text). */
export const OVERVIEW_CARD_INFO: Record<OverviewCardId, string> = {
  gross_volume:
    'Sum of booking amounts for paid, confirmed, or completed bookings. Each booking is counted on the local calendar day it was created. Chart shows cumulative totals over the last 7 days vs the week before.',
  new_customers:
    'Number of bookings that are not cancelled—one per booking. Counted by the day each booking was created. Compares this 7-day window to the previous 7 days.',
  successful_payments:
    'Count of bookings in paid, confirmed, or completed status, by the day they were created. Cumulative lines compare this week to last week.',
  net_volume:
    'Sum of booking amounts for completed bookings only, by created date. Useful for settled revenue in the window vs the prior week.',
  payments:
    'Total booking count (any status), by the day each booking was created. Includes pending and other states unless filtered elsewhere.',
  failed_payments:
    'Bookings with declined payment status, counted by the day they were created. Compared to the previous 7-day period.',
}

/** Last 7 local calendar days (inclusive of today) vs the prior 7 days; all based on `created_at`. */
export function buildOverviewCards(
  bookings: Array<{ status: string; total_price: number | null; created_at: string }>,
  now: Date = new Date()
): OverviewCardModel[] {
  const todayStart = localDateOnly(now)
  const currentWindowStart = addDays(todayStart, -6)
  const previousWindowStart = addDays(currentWindowStart, -7)

  const tooltipDayLabelsCurrent = Array.from({ length: 7 }, (_, i) =>
    formatRangeDay(addDays(currentWindowStart, i))
  )
  const tooltipDayLabelsPrevious = Array.from({ length: 7 }, (_, i) =>
    formatRangeDay(addDays(previousWindowStart, i))
  )

  return CARD_ORDER.map((id) => {
    const cur = buildDailyAndTotal(bookings, currentWindowStart, id)
    const prev = buildDailyAndTotal(bookings, previousWindowStart, id)
    return {
      id,
      label: LABELS[id],
      valueType: VALUE_TYPES[id],
      currentTotal: cur.total,
      previousTotal: prev.total,
      dailyCurrent: cur.daily,
      dailyPrevious: prev.daily,
      rangeLabelStart: formatRangeDay(currentWindowStart),
      rangeLabelEnd: formatRangeDay(todayStart),
      tooltipDayLabelsCurrent,
      tooltipDayLabelsPrevious,
    }
  })
}
