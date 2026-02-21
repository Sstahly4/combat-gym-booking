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
 * Calculate price based on package type and billing units
 * Training: billed per day
 * Accommodation & All-Inclusive: billed per week (rounded up), with monthly breakpoint at 28+ days
 */
export function calculatePackagePrice(
  durationDays: number,
  packageType: 'training' | 'accommodation' | 'all_inclusive',
  prices: {
    daily: number | null
    weekly: number | null
    monthly: number | null
  }
): { price: number; unit: 'day' | 'week' | 'month'; duration: number; durationLabel: string } {
  // Training Only: billed per day
  if (packageType === 'training') {
    const price = (prices.daily || 0) * durationDays
    return {
      price,
      unit: 'day',
      duration: durationDays,
      durationLabel: durationDays === 1 ? '1 day' : `${durationDays} days`
    }
  }

  // Accommodation & All Inclusive: billed per week (minimum 1 week, rounded up)
  const weeks = Math.max(1, Math.ceil(durationDays / 7))
  
  if (durationDays >= 28 && prices.monthly) {
    // Monthly bundle pricing (predictable, not "cheapest"):
    // - 28–30 days => 1 month
    // - 31–60 days => 1 month + remainder (weeks + days)
    // - 61–90 days => 2 months + remainder, etc.
    //
    // We treat "month" as a 30-day bundle. Then we price any remainder using:
    // weeks (7-day bundles) + leftover days (if daily exists).
    // If daily does not exist, leftover days are rounded up to an extra week (if weekly exists).
    const months = Math.max(1, Math.floor(durationDays / 30))
    const baseDaysCovered = months * 30
    const remainderDays = Math.max(0, durationDays - baseDaysCovered)

    const remainderWeeks = prices.weekly ? Math.floor(remainderDays / 7) : 0
    const remainderAfterWeeks = remainderDays - remainderWeeks * 7

    const needsExtraWeek = (!prices.daily && prices.weekly && remainderAfterWeeks > 0)
    const extraWeekCount = needsExtraWeek ? 1 : 0
    const remainderDaily = prices.daily ? remainderAfterWeeks : 0

    const remainderPrice =
      (remainderWeeks * (prices.weekly || 0)) +
      (extraWeekCount * (prices.weekly || 0)) +
      (remainderDaily * (prices.daily || 0))

    const totalMonthsLabel = months === 1 ? '1 month' : `${months} months`
    const remainderLabelParts: string[] = []
    if (remainderWeeks > 0 || extraWeekCount > 0) {
      const w = remainderWeeks + extraWeekCount
      remainderLabelParts.push(w === 1 ? '1 week' : `${w} weeks`)
    }
    if (remainderDaily > 0) {
      remainderLabelParts.push(remainderDaily === 1 ? '1 day' : `${remainderDaily} days`)
    }
    const durationLabel = remainderLabelParts.length > 0
      ? `${totalMonthsLabel} + ${remainderLabelParts.join(' + ')}`
      : totalMonthsLabel

    return {
      price: (months * prices.monthly) + remainderPrice,
      unit: 'month',
      duration: months,
      durationLabel
    }
  }
  
  if (prices.weekly) {
    return {
      price: weeks * prices.weekly,
      unit: 'week',
      duration: weeks,
      durationLabel: weeks === 1 ? '1 week' : `${weeks} weeks`
    }
  }
  
  // Fallback: if no weekly price, use daily * 7 * weeks (shouldn't happen but safety)
  const fallbackPrice = (prices.daily || 0) * 7 * weeks
  return {
    price: fallbackPrice,
    unit: 'week',
    duration: weeks,
    durationLabel: weeks === 1 ? '1 week' : `${weeks} weeks`
  }
}
