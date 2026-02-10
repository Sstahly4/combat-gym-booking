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
  if (durationDays >= 28 && prices.monthly) {
    return (durationDays / 30) * prices.monthly
  }
  if (durationDays >= 7 && prices.weekly) {
    return (durationDays / 7) * prices.weekly
  }
  return durationDays * prices.daily
}

/**
 * Calculate price based on package type and billing units
 * Training Only: per day
 * Training + Accommodation / All Inclusive: per week (minimum 1 week, rounded up)
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
  // Training Only: billed per day (but displayed as per session)
  if (packageType === 'training') {
    const price = (prices.daily || 0) * durationDays
    return {
      price,
      unit: 'day',
      duration: durationDays,
      durationLabel: durationDays === 1 ? '1 session' : `${durationDays} sessions`
    }
  }

  // Accommodation & All Inclusive: billed per week (minimum 1 week, rounded up)
  const weeks = Math.max(1, Math.ceil(durationDays / 7))
  
  if (durationDays >= 28 && prices.monthly) {
    // For monthly pricing, calculate based on weeks (4 weeks = 1 month)
    const months = Math.ceil(weeks / 4)
    return {
      price: months * prices.monthly,
      unit: 'month',
      duration: months,
      durationLabel: months === 1 ? '1 month' : `${months} months`
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
