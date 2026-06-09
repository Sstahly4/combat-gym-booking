import { subDays, parseISO, format, set } from 'date-fns'
import type { ReactNode } from 'react'

export interface BookingTrustLineProps {
  pkg: {
    cancellation_policy_days: number | null
    includes_accommodation?: boolean | null
    accommodation_name?: string | null
    includes_meals?: boolean | null
    meal_plan_details?: {
      breakfast?: boolean
      lunch?: boolean
      dinner?: boolean
      description?: string
    } | null
    name?: string | null
  }
  gym?: {
    amenities?: {
      airport_transfer?: boolean
      physiotherapy?: boolean
      recovery_facilities?: boolean
      nutritionist?: boolean
    } | null
  } | null
  checkin: string
  className?: string
  variant?: 'inline' | 'featured'
}

// ─── Inline (unchanged from original) ────────────────────────────────────────

function getInlineText(
  pkg: BookingTrustLineProps['pkg'],
  gym: BookingTrustLineProps['gym'],
  checkin: string
): string | null {
  const cutoffDate =
    pkg.cancellation_policy_days != null && checkin
      ? subDays(parseISO(checkin), pkg.cancellation_policy_days)
      : null

  const hasFreeCancellation = cutoffDate !== null && new Date() < cutoffDate

  if (hasFreeCancellation) {
    return `Free cancellation before ${format(cutoffDate, 'd MMM')}`
  }

  if (pkg.cancellation_policy_days !== null) {
    return 'Non-refundable — cancellation policy applies'
  }

  if (pkg.includes_accommodation) {
    return `Accommodation included${pkg.accommodation_name ? ` — ${pkg.accommodation_name}` : ''}`
  }

  if (pkg.includes_meals) {
    const m = pkg.meal_plan_details
    const mealList = [
      m?.breakfast && 'breakfast',
      m?.lunch && 'lunch',
      m?.dinner && 'dinner',
    ].filter(Boolean) as string[]
    return mealList.length > 0 ? `${mealList.join(' & ')} included` : 'Meals included'
  }

  if (gym?.amenities?.airport_transfer) return 'Airport transfer available'
  if (gym?.amenities?.physiotherapy || gym?.amenities?.recovery_facilities) return 'Physiotherapy & recovery on-site'
  if (gym?.amenities?.nutritionist) return 'Nutritionist on-site'

  // No meaningful signal — render nothing rather than restating the package type
  return null
}

// ─── Featured (two-line) ──────────────────────────────────────────────────────

interface TrustSignal {
  mainText: string
  subText: ReactNode
}

const POLICY_LINK = (
  <a
    href="/faq#faq-what-happens-to-my-money"
    className="underline underline-offset-2 hover:text-gray-700"
  >
    Full policy ↗
  </a>
)

function getFeaturedSignal(
  pkg: BookingTrustLineProps['pkg'],
  gym: BookingTrustLineProps['gym'],
  checkin: string
): TrustSignal | null {
  const cutoffDate =
    pkg.cancellation_policy_days != null && checkin
      ? subDays(parseISO(checkin), pkg.cancellation_policy_days)
      : null

  const hasFreeCancellation = cutoffDate !== null && new Date() < cutoffDate

  if (hasFreeCancellation && cutoffDate) {
    // OTA convention: cutoff is end-of-day on the cutoff date (23:59)
    const cutoffAt2359 = set(cutoffDate, { hours: 23, minutes: 59, seconds: 0 })
    const formatted = format(cutoffAt2359, "d MMM 'at' HH:mm")
    return {
      mainText: 'Free cancellation',
      subText: (
        <>
          Cancel before {formatted} for a full refund · {POLICY_LINK}
        </>
      ),
    }
  }

  if (pkg.cancellation_policy_days !== null) {
    return {
      mainText: 'Non-refundable',
      subText: (
        <>
          This booking cannot be cancelled or refunded · {POLICY_LINK}
        </>
      ),
    }
  }

  if (pkg.includes_accommodation) {
    const name = pkg.accommodation_name || pkg.name || 'Accommodation'
    return {
      mainText: `Accommodation included${pkg.accommodation_name ? ` — ${pkg.accommodation_name}` : ''}`,
      subText: `${name} is included in this package`,
    }
  }

  if (pkg.includes_meals) {
    const m = pkg.meal_plan_details
    const mealList = [
      m?.breakfast && 'Breakfast',
      m?.lunch && 'Lunch',
      m?.dinner && 'Dinner',
    ].filter(Boolean) as string[]
    const mainText = mealList.length > 0 ? `${mealList.join(' & ')} included` : 'Meals included'
    return {
      mainText,
      subText: 'Meals are provided by the gym as part of this package',
    }
  }

  if (gym?.amenities?.airport_transfer) {
    return {
      mainText: 'Airport transfer available',
      subText: 'Arrange your transfer directly with the gym after booking',
    }
  }

  if (gym?.amenities?.physiotherapy || gym?.amenities?.recovery_facilities) {
    return {
      mainText: 'Physiotherapy & recovery on-site',
      subText: 'Available at the gym — arrange directly after booking',
    }
  }

  if (gym?.amenities?.nutritionist) {
    return {
      mainText: 'Nutritionist on-site',
      subText: 'Available at the gym — arrange directly after booking',
    }
  }

  // No meaningful signal — package type is already shown in the gym identity section
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingTrustLine({
  pkg,
  gym,
  checkin,
  className = '',
  variant = 'inline',
}: BookingTrustLineProps) {
  if (!checkin) return null

  if (variant === 'featured') {
    const signal = getFeaturedSignal(pkg, gym, checkin)
    if (!signal) return null
    const { mainText, subText } = signal
    return (
      <div className={className}>
        <p className="text-sm font-medium text-gray-900">{mainText}</p>
        <p className="mt-0.5 text-xs text-gray-500">{subText}</p>
      </div>
    )
  }

  const text = getInlineText(pkg, gym, checkin)
  if (!text) return null
  return (
    <span className={`text-xs text-gray-500 ${className}`}>{text}</span>
  )
}
