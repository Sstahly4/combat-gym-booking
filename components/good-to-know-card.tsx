'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'
import type { Package, PackageVariant } from '@/lib/types/database'
import type { GymCancellationPolicyTone } from '@/lib/booking/cancellation-policy'
import { getCancellationMarketingLines } from '@/lib/booking/cancellation-policy'

interface GoodToKnowCardProps {
  package_: Package
  variant: PackageVariant | null
  checkin: string
  checkout: string
  gymPolicyTone?: GymCancellationPolicyTone | null
}

export function GoodToKnowCard({
  package_,
  variant,
  checkin,
  checkout: _checkout,
  gymPolicyTone,
}: GoodToKnowCardProps) {
  const points: string[] = []

  points.push("No payment needed now. You'll pay when the gym confirms your booking.")

  const { goodToKnowBullet } = getCancellationMarketingLines({
    startDate: checkin,
    packageCancellationPolicyDays: package_.cancellation_policy_days,
    gymPolicyTone: gymPolicyTone ?? null,
  })
  if (goodToKnowBullet) {
    points.push(goodToKnowBullet)
  }

  if (package_.type === 'accommodation' || package_.type === 'all_inclusive') {
    if (variant) {
      if (variant.room_type === 'private') {
        points.push("You'll get the entire room to yourself!")
      } else if (variant.room_type === 'shared') {
        points.push("You'll be sharing the room with other guests.")
      } else {
        points.push('Accommodation is included in your booking.')
      }
    } else if (package_.includes_accommodation) {
      points.push('Accommodation is included in your booking.')
    }
  }

  if (package_.includes_meals || package_.type === 'all_inclusive') {
    if (package_.meal_plan_details) {
      const mealDetails = package_.meal_plan_details

      if (mealDetails.description) {
        points.push(mealDetails.description)
      } else {
        const meals: string[] = []
        if (mealDetails.breakfast) meals.push('breakfast')
        if (mealDetails.lunch) meals.push('lunch')
        if (mealDetails.dinner) meals.push('dinner')

        if (meals.length > 0) {
          if (meals.length === 3) {
            points.push('All meals are included - breakfast, lunch, and dinner!')
          } else {
            const mealsText = meals.join(' and ')
            points.push(
              `${mealsText.charAt(0).toUpperCase() + mealsText.slice(1)} ${meals.length === 1 ? 'is' : 'are'} included in your package.`
            )
          }
        } else if (mealDetails.meals_per_day) {
          points.push(
            `${mealDetails.meals_per_day} meal${mealDetails.meals_per_day > 1 ? 's' : ''} per day included.`
          )
        } else {
          points.push('Meals are included in your package.')
        }
      }
    } else if (package_.type === 'all_inclusive') {
      points.push('All meals are included in your package.')
    } else if (package_.includes_meals) {
      points.push('Meals are included in your package.')
    }
  } else {
    points.push('Your booking details will be confirmed by the gym shortly.')
  }

  const displayPoints = points.slice(0, 3)

  return (
    <Card className="border border-gray-300 rounded-lg shadow-sm bg-white">
      <CardContent className="p-5">
        <h3 className="font-bold text-base mb-4 text-gray-900">Good to know:</h3>
        <div className="space-y-3">
          {displayPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm text-gray-900 leading-relaxed flex-1">{point}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
