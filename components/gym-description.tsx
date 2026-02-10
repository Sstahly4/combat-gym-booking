'use client'

import { useState, useEffect } from 'react'
import { FacilitiesList } from './facilities-list'

interface GymDescriptionProps {
  gymName: string
  description?: string | null
  landmarksText?: string
  amenities?: any
  disciplines?: string[]
}

export function GymDescription({ gymName, description, landmarksText, amenities, disciplines }: GymDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  
  useEffect(() => {
    // Check if we're on desktop (md breakpoint is 768px)
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])
  
  // Different character limits for mobile vs desktop
  const MAX_LENGTH_MOBILE = 200 // Characters to show before "See more" on mobile
  const MAX_LENGTH_DESKTOP = 500 // Characters to show before "See more" on desktop
  const MAX_LENGTH = isDesktop ? MAX_LENGTH_DESKTOP : MAX_LENGTH_MOBILE
  
  // Determine if description is long enough to need "See more"
  const needsExpansion = description && description.length > MAX_LENGTH

  return (
    <div className="pt-2">
      <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-gray-900">About {gymName}</h2>
      <div className="text-gray-700 leading-relaxed text-sm md:text-[15px] mb-4 md:mb-6 space-y-2 md:space-y-3">
        {description && (
          <div>
            <p className="whitespace-pre-wrap">
              {needsExpansion && !isExpanded 
                ? `${description.substring(0, MAX_LENGTH)}...` 
                : description
              }
            </p>
            {needsExpansion && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[#003580] font-medium text-sm mt-2 hover:underline"
              >
                {isExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        )}
        {landmarksText && (
          <>
            <p>{landmarksText}</p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
              Distance in property description is calculated using © OpenStreetMap
            </p>
          </>
        )}
      </div>
      
      {/* Facilities - Integrated with description */}
      <FacilitiesList amenities={amenities} disciplines={disciplines} />
    </div>
  )
}
