'use client'

import { Check } from 'lucide-react'
import type { Gym, Package } from '@/lib/types/database'
import type { GymCancellationPolicyTone } from '@/lib/booking/cancellation-policy'
import { getCancellationMarketingLines } from '@/lib/booking/cancellation-policy'

type BookingSafetyPoliciesProps = {
  package_: Package
  checkin: string
  gymPolicyTone?: GymCancellationPolicyTone | null
  gym: Pick<Gym, 'amenities'>
  className?: string
}

export function BookingSafetyPolicies({
  package_,
  checkin,
  gymPolicyTone,
  gym,
  className = 'space-y-3 pb-6 border-b border-gray-200',
}: BookingSafetyPoliciesProps) {
  const amenities = gym.amenities as Record<string, boolean> | null | undefined
  const { safetyPoliciesLine } = getCancellationMarketingLines({
    startDate: checkin,
    packageCancellationPolicyDays: package_.cancellation_policy_days,
    gymPolicyTone: gymPolicyTone ?? null,
  })

  return (
    <div className={className}>
      <h3 className="text-base font-bold text-gray-900">Safety &amp; policies</h3>
      <div className="space-y-2 text-sm text-gray-700 mt-3">
        <div className="flex items-start gap-2">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <span>Booking Guarantee</span>
        </div>
        {safetyPoliciesLine ? (
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>{safetyPoliciesLine}</span>
          </div>
        ) : null}
        <div className="flex items-start gap-2">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <span>Secure payment processing</span>
        </div>
        {amenities?.fire_safety && (
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Fire safety compliant</span>
          </div>
        )}
        {amenities?.first_aid && (
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>First aid facilities available</span>
          </div>
        )}
      </div>
    </div>
  )
}
