'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { labelGymAmenity } from '@/lib/constants/gym-amenities'
import { GymAmenityIcon, GymDisciplineIcon } from '@/components/gym-amenity-icon'

interface FacilitiesListProps {
  amenities: Record<string, boolean>
  disciplines: string[]
}

const INITIAL_SHOW_COUNT_MOBILE = 4
const INITIAL_SHOW_COUNT_DESKTOP = 9

export function FacilitiesList({ amenities, disciplines }: FacilitiesListProps) {
  const [showAll, setShowAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const activeAmenities = Object.entries(amenities)
    .filter(([_, value]) => value)
    .map(([key, _]) => key)

  const allFacilities = [
    ...activeAmenities.map((key) => ({ type: 'amenity' as const, key })),
    ...disciplines.map((d) => ({ type: 'discipline' as const, key: d })),
  ]

  const initialCount = isMobile ? INITIAL_SHOW_COUNT_MOBILE : INITIAL_SHOW_COUNT_DESKTOP
  const facilitiesToShow = showAll ? allFacilities : allFacilities.slice(0, initialCount)
  const hasMore = allFacilities.length > initialCount

  const getFacilityName = (facility: { type: 'amenity' | 'discipline'; key: string }) => {
    if (facility.type === 'discipline') {
      return facility.key
    }
    return labelGymAmenity(facility.key)
  }

  const getFacilityIcon = (facility: { type: 'amenity' | 'discipline'; key: string }) => {
    if (facility.type === 'discipline') {
      return <GymDisciplineIcon size="lg" />
    }
    return <GymAmenityIcon amenityKey={facility.key} size="lg" />
  }

  if (allFacilities.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 text-gray-900">Most popular facilities</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
        {facilitiesToShow.map((facility) => (
          <div key={`${facility.type}-${facility.key}`} className="flex items-center gap-3 py-1.5">
            {getFacilityIcon(facility)}
            <span className="text-sm text-gray-700">{getFacilityName(facility)}</span>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center text-sm font-normal text-[#003580] can-hover:hover:underline"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                See less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                See more facilities ({allFacilities.length - initialCount} more)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
