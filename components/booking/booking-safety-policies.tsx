'use client'

import { Check } from 'lucide-react'
import type { Gym } from '@/lib/types/database'
import { GYM_AMENITY_BY_CATEGORY, labelGymAmenity } from '@/lib/constants/gym-amenities'
import { GUEST_ARRIVAL_ACCEPTANCE_POLICY_SHORT } from '@/lib/legal/guest-arrival-policy'

type BookingSafetyPoliciesProps = {
  gym: Pick<Gym, 'amenities'>
  className?: string
}

function buildGymSafetyLines(gym: Pick<Gym, 'amenities'>): string[] {
  const amenities = gym.amenities as Record<string, boolean> | null | undefined
  if (!amenities) return []

  return GYM_AMENITY_BY_CATEGORY.safety_access
    .filter((key) => amenities[key] === true)
    .map((key) => labelGymAmenity(key))
}

export function BookingSafetyPolicies({
  gym,
  className = 'space-y-3 pb-6 border-b border-gray-200',
}: BookingSafetyPoliciesProps) {
  const policyLines = [...buildGymSafetyLines(gym), GUEST_ARRIVAL_ACCEPTANCE_POLICY_SHORT]

  if (policyLines.length === 0) return null

  return (
    <div className={className}>
      <h3 className="text-base font-bold text-gray-900">Safety &amp; policies</h3>
      <div className="space-y-2 text-sm text-gray-700 mt-3">
        {policyLines.map((line) => (
          <div key={line} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" aria-hidden />
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
