import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateEstimatedPrice(
  durationDays: number,
  prices: {
    daily: number
    weekly: number | null
    monthly: number | null
  }
) {
  // Keep estimates consistent with checkout pricing rules.
  //
  // IMPORTANT: We deliberately do NOT "choose the cheapest" combination.
  // We apply a predictable policy:
  // - If monthly pricing exists and the stay is long (28+ days), apply a monthly bundle,
  //   then price any remainder by weeks, then days.
  // - Otherwise apply weekly bundles (rounded up), then daily.

  // Monthly bundle path (28+ days): 1 month covers up to 30 days.
  if (durationDays >= 28 && prices.monthly) {
    const months = Math.max(1, Math.floor(durationDays / 30))
    const baseDaysCovered = months * 30
    const remainderDays = Math.max(0, durationDays - baseDaysCovered)

    const weeks = prices.weekly ? Math.floor(remainderDays / 7) : 0
    const afterWeeks = remainderDays - weeks * 7

    // If daily exists, price the leftover days precisely.
    // If daily does NOT exist, round leftover days up to a full week (weekly) if possible.
    const extraWeeks = (!prices.daily && prices.weekly && afterWeeks > 0) ? 1 : 0
    const extraDays = (prices.daily ? afterWeeks : 0)

    return (months * prices.monthly) +
      (weeks * (prices.weekly || 0)) +
      (extraWeeks * (prices.weekly || 0)) +
      (extraDays * prices.daily)
  }

  // Weekly bundle fallback (rounded up; legacy behavior for accom/all-inclusive).
  if (durationDays >= 7 && prices.weekly) {
    const weeks = Math.max(1, Math.ceil(durationDays / 7))
    return weeks * prices.weekly
  }

  // Daily fallback
  return durationDays * prices.daily
}

/**
 * OTA-style line item used in the transparent checkout breakdown.
 * Each line is what the guest sees on the receipt.
 */
export type PriceLine = {
  label: string         // "Weekly bundle × 2"
  qty: number           // 2
  unitPrice: number     // 1400
  subtotal: number      // 2800
  kind: 'month' | 'week' | 'night'
}

export type PriceBreakdown = {
  /** Final amount the guest pays. */
  price: number
  /** Granular line items for the receipt UI. */
  lines: PriceLine[]
  /** Anchor unit used for headline display ("per night" / "per week" / "per month"). */
  unit: 'day' | 'week' | 'month'
  /** Number of anchor units (e.g. 3 weeks). */
  duration: number
  /** Human label for the anchor (e.g. "3 weeks", "1 month + 4 nights"). */
  durationLabel: string
  /**
   * Difference vs paying every night at the nightly rate. Positive means the
   * waterfall saved the guest money — used for the "You saved $X" trigger.
   */
  savedVsNightly: number
}

type Prices = {
  daily: number | null
  weekly: number | null
  monthly: number | null
}

function priceLinearWeekly(durationDays: number, prices: Prices): { price: number; lines: PriceLine[] } {
  // Weeks-and-extra-nights path. Used both as the standalone < 28 night calc
  // and as the comparison candidate at the monthly cliff.
  const lines: PriceLine[] = []
  const weeklyRate = prices.weekly ?? 0
  const nightlyRate = prices.daily ?? 0

  const fullWeeks = Math.floor(durationDays / 7)
  const remainderNights = durationDays - fullWeeks * 7

  let price = 0

  if (fullWeeks > 0 && weeklyRate > 0) {
    const subtotal = fullWeeks * weeklyRate
    price += subtotal
    lines.push({
      label: fullWeeks === 1 ? 'Weekly bundle' : `Weekly bundle × ${fullWeeks}`,
      qty: fullWeeks,
      unitPrice: weeklyRate,
      subtotal,
      kind: 'week',
    })
  }

  if (remainderNights > 0) {
    if (nightlyRate > 0) {
      const subtotal = remainderNights * nightlyRate
      price += subtotal
      lines.push({
        label: remainderNights === 1 ? '1 extra night' : `${remainderNights} extra nights`,
        qty: remainderNights,
        unitPrice: nightlyRate,
        subtotal,
        kind: 'night',
      })
    } else if (weeklyRate > 0) {
      // No nightly rate set — round remainder up to a full week (legacy fallback).
      price += weeklyRate
      lines.push({
        label: 'Partial week (rounded to 1 week)',
        qty: 1,
        unitPrice: weeklyRate,
        subtotal: weeklyRate,
        kind: 'week',
      })
    }
  }

  // Edge case: stay shorter than a week with no weekly path triggered.
  if (lines.length === 0 && nightlyRate > 0) {
    price = durationDays * nightlyRate
    lines.push({
      label: durationDays === 1 ? '1 night' : `${durationDays} nights`,
      qty: durationDays,
      unitPrice: nightlyRate,
      subtotal: price,
      kind: 'night',
    })
  }

  return { price, lines }
}

function priceWithMonthlyBundle(durationDays: number, prices: Prices): { price: number; lines: PriceLine[] } {
  // Monthly bundle path. Treats 1 month as 30 nights, then prices remainder
  // using the same weekly+nightly waterfall as priceLinearWeekly.
  const lines: PriceLine[] = []
  const monthlyRate = prices.monthly ?? 0
  if (monthlyRate <= 0) return priceLinearWeekly(durationDays, prices)

  const months = Math.max(1, Math.floor(durationDays / 30))
  const monthsPrice = months * monthlyRate
  lines.push({
    label: months === 1 ? 'Monthly bundle' : `Monthly bundle × ${months}`,
    qty: months,
    unitPrice: monthlyRate,
    subtotal: monthsPrice,
    kind: 'month',
  })

  const remainderDays = Math.max(0, durationDays - months * 30)
  if (remainderDays > 0) {
    const remainder = priceLinearWeekly(remainderDays, prices)
    lines.push(...remainder.lines)
    return { price: monthsPrice + remainder.price, lines }
  }

  return { price: monthsPrice, lines }
}

function makeDurationLabel(lines: PriceLine[]): string {
  // "1 month + 1 week + 2 nights" etc., derived from the receipt lines.
  const parts: string[] = []
  const months = lines.filter((l) => l.kind === 'month').reduce((s, l) => s + l.qty, 0)
  const weeks = lines.filter((l) => l.kind === 'week').reduce((s, l) => s + l.qty, 0)
  const nights = lines.filter((l) => l.kind === 'night').reduce((s, l) => s + l.qty, 0)
  if (months > 0) parts.push(months === 1 ? '1 month' : `${months} months`)
  if (weeks > 0) parts.push(weeks === 1 ? '1 week' : `${weeks} weeks`)
  if (nights > 0) parts.push(nights === 1 ? '1 night' : `${nights} nights`)
  return parts.length > 0 ? parts.join(' + ') : '1 night'
}

/**
 * Calculate price using the OTA waterfall:
 *  - Training-only: pure per-night.
 *  - Accommodation / All-inclusive: weekly bundles for full weeks, then nightly
 *    for any remainder. At 24+ nights we ALSO compare against the monthly bundle
 *    path and charge whichever is cheaper (the "monthly cliff" smoothing).
 *
 * Returns line items so checkout can show a transparent receipt
 * (à la Booking.com / Airbnb) and a `savedVsNightly` figure for the
 * "Weekly bundle saved you $X" conversion trigger.
 */
export function calculatePackagePrice(
  durationDays: number,
  packageType: 'training' | 'accommodation' | 'all_inclusive',
  prices: Prices
): PriceBreakdown {
  // Training-only: pure per-night, no bundles.
  if (packageType === 'training') {
    const nightly = prices.daily ?? 0
    const price = nightly * durationDays
    return {
      price,
      lines: [
        {
          label: durationDays === 1 ? '1 session' : `${durationDays} sessions`,
          qty: durationDays,
          unitPrice: nightly,
          subtotal: price,
          kind: 'night',
        },
      ],
      unit: 'day',
      duration: durationDays,
      durationLabel: durationDays === 1 ? '1 day' : `${durationDays} days`,
      savedVsNightly: 0,
    }
  }

  if (durationDays <= 0) {
    return {
      price: 0,
      lines: [],
      unit: 'week',
      duration: 0,
      durationLabel: '0 nights',
      savedVsNightly: 0,
    }
  }

  // Build candidate paths and pick the cheapest (best price for the guest).
  const weeklyPath = priceLinearWeekly(durationDays, prices)
  const candidates: Array<{ price: number; lines: PriceLine[]; tag: 'weekly' | 'monthly' }> = [
    { ...weeklyPath, tag: 'weekly' },
  ]
  // Only consider monthly when we're close to / past the cliff. This avoids
  // weird "your 9-night stay was upgraded to a month" outcomes.
  if (prices.monthly && durationDays >= 24) {
    const monthlyPath = priceWithMonthlyBundle(durationDays, prices)
    candidates.push({ ...monthlyPath, tag: 'monthly' })
  }

  const best = candidates.reduce((a, b) => (b.price > 0 && b.price < a.price ? b : a))

  // Compare the chosen path against "if every night were billed at nightly rate"
  // to surface the bundle savings to the guest.
  const nightlyRate = prices.daily ?? 0
  const nightlyOnlyPrice = nightlyRate * durationDays
  const savedVsNightly = nightlyOnlyPrice > 0 ? Math.max(0, nightlyOnlyPrice - best.price) : 0

  const headlineUnit: 'week' | 'month' = best.tag === 'monthly' ? 'month' : 'week'
  const headlineDuration =
    best.tag === 'monthly'
      ? best.lines.filter((l) => l.kind === 'month').reduce((s, l) => s + l.qty, 0) || 1
      : Math.max(1, Math.ceil(durationDays / 7))

  return {
    price: best.price,
    lines: best.lines,
    unit: headlineUnit,
    duration: headlineDuration,
    durationLabel: makeDurationLabel(best.lines),
    savedVsNightly,
  }
}
