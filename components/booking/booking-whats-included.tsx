'use client'

import { Check } from 'lucide-react'
import type { Gym, Package } from '@/lib/types/database'

type BookingWhatsIncludedProps = {
  package_: Package
  duration: number
  pricingDuration: number
  gym: Pick<Gym, 'amenities'>
  className?: string
}

export function BookingWhatsIncluded({
  package_,
  duration,
  pricingDuration,
  gym,
  className = 'space-y-4 pb-6 border-b border-gray-200',
}: BookingWhatsIncludedProps) {
  const amenities = gym.amenities as Record<string, boolean> | null | undefined

  return (
    <div className={className}>
      <h3 className="text-base font-bold text-gray-900">What&apos;s included</h3>
      <div className="space-y-2 text-sm mt-3">
        {package_.type === 'training' && (
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              Training sessions for {pricingDuration} {pricingDuration === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}
        {(package_.type === 'accommodation' || package_.type === 'all_inclusive') && (
          <>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Training sessions included</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Accommodation for {duration} {duration === 1 ? 'night' : 'nights'}
              </span>
            </div>
          </>
        )}
        {package_.includes_meals && (
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              {package_.meal_plan_details?.meals_per_day
                ? `${package_.meal_plan_details.meals_per_day} meal${package_.meal_plan_details.meals_per_day > 1 ? 's' : ''} per day`
                : 'Meals included'}
            </span>
          </div>
        )}
        {amenities?.wifi && (
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Free WiFi</span>
          </div>
        )}
        {amenities?.parking && (
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Parking available</span>
          </div>
        )}
        {amenities?.security && (
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">24/7 Security</span>
          </div>
        )}
      </div>
    </div>
  )
}
