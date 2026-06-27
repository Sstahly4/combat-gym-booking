'use client'

import {
  GYM_AMENITY_CATEGORIES,
  GYM_AMENITY_BY_CATEGORY,
  countEnabledAmenities,
  labelGymAmenity,
} from '@/lib/constants/gym-amenities'
import { cn } from '@/lib/utils'

export function GymAmenitiesPreview({
  amenities,
  className,
}: {
  amenities: Record<string, boolean>
  className?: string
}) {
  const selectedCount = countEnabledAmenities(amenities)

  const grouped = GYM_AMENITY_CATEGORIES.map((category) => ({
    label: category.label,
    keys: GYM_AMENITY_BY_CATEGORY[category.id].filter((key) => amenities[key]),
  })).filter((group) => group.keys.length > 0)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.03]',
        className,
      )}
    >
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
      </div>

      <div className="p-5">
        {selectedCount === 0 ? (
          <p className="text-sm text-gray-500">Amenities you add will appear here.</p>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{selectedCount}</span>{' '}
              {selectedCount === 1 ? 'amenity' : 'amenities'} on your listing
            </p>
            <div className="space-y-4">
              {grouped.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {group.label}
                  </h3>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {group.keys.map((key) => (
                      <li
                        key={key}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm text-gray-800"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#003580]" aria-hidden />
                        {labelGymAmenity(key)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
