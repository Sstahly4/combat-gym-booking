import { subDays, parseISO, format } from 'date-fns'

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
}

function getTrustText(
  pkg: BookingTrustLineProps['pkg'],
  gym: BookingTrustLineProps['gym'],
  checkin: string
): string {
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

  if (gym?.amenities?.airport_transfer) {
    return 'Airport transfer available'
  }

  if (gym?.amenities?.physiotherapy || gym?.amenities?.recovery_facilities) {
    return 'Physiotherapy & recovery on-site'
  }

  if (gym?.amenities?.nutritionist) {
    return 'Nutritionist on-site'
  }

  return 'Training only package'
}

export function BookingTrustLine({ pkg, gym, checkin, className = '' }: BookingTrustLineProps) {
  if (!checkin) return null

  const text = getTrustText(pkg, gym, checkin)

  return (
    <span className={`text-xs text-gray-500 ${className}`}>{text}</span>
  )
}
