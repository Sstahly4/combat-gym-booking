'use client'

import { Check } from 'lucide-react'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'
import { buildPackageInclusionLines } from '@/lib/booking/package-inclusions'

type BookingWhatsIncludedProps = {
  package_: Package
  duration: number
  pricingDuration: number
  gym: Pick<Gym, 'amenities'> & { training_schedule?: Gym['training_schedule'] }
  variant?: PackageVariant | null
  className?: string
}

export function BookingWhatsIncluded({
  package_,
  duration,
  pricingDuration,
  gym,
  variant,
  className = 'space-y-4 pb-6 border-b border-gray-200',
}: BookingWhatsIncludedProps) {
  const amenities = gym.amenities as Record<string, boolean> | null | undefined
  const lines = buildPackageInclusionLines(package_, gym, variant, 8)

  const durationLines: string[] = []
  if (package_.type === 'training') {
    durationLines.push(
      `Training sessions for ${pricingDuration} ${pricingDuration === 1 ? 'day' : 'days'}`
    )
  }
  if (package_.type === 'accommodation' || package_.type === 'all_inclusive') {
    durationLines.push(
      `Accommodation for ${duration} ${duration === 1 ? 'night' : 'nights'}`
    )
  }

  const amenityExtras: string[] = []
  if (amenities?.wifi) amenityExtras.push('Free WiFi')
  if (amenities?.parking) amenityExtras.push('Parking available')
  if (amenities?.security) amenityExtras.push('24/7 Security')

  const displayLines = [...lines, ...durationLines, ...amenityExtras].filter(
    (line, index, all) => all.indexOf(line) === index
  )

  if (displayLines.length === 0) return null

  return (
    <div className={className}>
      <h3 className="text-base font-bold text-gray-900">What&apos;s included</h3>
      <div className="space-y-2 text-sm mt-3">
        {displayLines.map((line) => (
          <div key={line} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
