'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [isClamped, setIsClamped] = useState(false)
  const descRef = useRef<HTMLDivElement>(null)

  // After mount, check if the content is actually taller than the collapsed height
  // so we only show the button when there's genuinely overflow.
  useEffect(() => {
    const el = descRef.current
    if (!el) return
    setIsClamped(el.scrollHeight > el.clientHeight + 2)
  }, [description])

  return (
    <div className="pt-2">
      <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-gray-900">About {gymName}</h2>
      <div className="text-gray-700 leading-relaxed text-sm md:text-[15px] mb-4 md:mb-6 space-y-2 md:space-y-3">
        {description && (
          <div>
            {/*
              Full text is ALWAYS in the DOM so Googlebot can read it.
              CSS overflow:hidden + maxHeight creates the visual truncation;
              overflow:hidden content is indexed normally by crawlers.
            */}
            <div
              ref={descRef}
              className="overflow-hidden transition-[max-height] duration-300"
              style={isExpanded ? { maxHeight: 'none' } : { maxHeight: '7.5rem' }}
            >
              <p className="whitespace-pre-wrap">{description}</p>
            </div>
            {(isClamped || isExpanded) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[#003580] font-medium text-sm mt-2 hover:underline"
              >
                {isExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Facilities - Integrated with description */}
      <FacilitiesList amenities={amenities} disciplines={disciplines || []} />

      {/* Getting to section — dedicated H2 so Google indexes location proximity */}
      {landmarksText && (
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-100">
          <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-gray-900">
            Getting to {gymName}
          </h2>
          <p className="text-sm md:text-[15px] text-gray-700 leading-relaxed">{landmarksText}</p>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
            Distance calculated using © OpenStreetMap
          </p>
        </div>
      )}
    </div>
  )
}
