'use client'

import { useState, useMemo } from 'react'
import { FacilitiesList } from './facilities-list'

const MAX_PREVIEW_CHARS = 300

function getPreview(text: string): string {
  if (text.length <= MAX_PREVIEW_CHARS) return text
  const slice = text.slice(0, MAX_PREVIEW_CHARS)
  // Prefer ending after a complete sentence (handles both ". " and ".\n" formats)
  const lastSentence = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('.\n'),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('!\n'),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('?\n'),
  )
  if (lastSentence > MAX_PREVIEW_CHARS / 2) {
    return slice.slice(0, lastSentence + 1).trimEnd()
  }
  // Fall back to the last word boundary
  return slice.replace(/\s\S*$/, '') + '\u2026'
}

interface GymDescriptionProps {
  gymName: string
  description?: string | null
  landmarksText?: string
  amenities?: any
  disciplines?: string[]
}

export function GymDescription({ gymName, description, landmarksText, amenities, disciplines }: GymDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const previewText = useMemo(() => (description ? getPreview(description) : ''), [description])
  const needsTruncation = !!description && description.length > MAX_PREVIEW_CHARS

  return (
    <div className="pt-2">
      <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-gray-900">About {gymName}</h2>
      <div className="text-gray-700 leading-relaxed text-sm md:text-[15px] mb-4 md:mb-6 space-y-2 md:space-y-3">
        {description && (
          <div>
            {/*
              Full text is ALWAYS in the DOM so Googlebot can read it.
              The hidden span uses overflow:hidden (not display:none) so crawlers
              index the full content while only the preview is visible when collapsed.
            */}
            {needsTruncation && !isExpanded && (
              <span className="overflow-hidden absolute h-0 w-0 block" aria-hidden="true">
                {description}
              </span>
            )}
            <p className="whitespace-pre-wrap">
              {isExpanded ? description : previewText}
            </p>
            {(needsTruncation || isExpanded) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[#003580] font-medium text-sm mt-2 can-hover:hover:underline"
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
