import { calculatePackagePrice } from '@/lib/utils'
import type { Package, PackageVariant } from '@/lib/types/database'

export function nightsBetween(startDate: string, endDate: string): number {
  return Math.floor(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  )
}

export function computeBookingPriceFromDates(
  startDate: string,
  endDate: string,
  package_: Pick<
    Package,
    'type' | 'price_per_day' | 'price_per_week' | 'price_per_month'
  >,
  variant?: Pick<
    PackageVariant,
    'price_per_day' | 'price_per_week' | 'price_per_month'
  > | null
) {
  const nights = nightsBetween(startDate, endDate)
  if (nights <= 0) return null

  const isTraining = package_.type === 'training'
  const duration = isTraining ? Math.max(1, nights + 1) : nights

  return calculatePackagePrice(duration, package_.type, {
    daily: variant?.price_per_day ?? package_.price_per_day,
    weekly: variant?.price_per_week ?? package_.price_per_week,
    monthly: variant?.price_per_month ?? package_.price_per_month,
  })
}
