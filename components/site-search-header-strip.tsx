'use client'

import { useState } from 'react'
import { CategoryTabs } from '@/components/category-tabs'
import { SearchBarRedesign } from '@/components/search-bar-redesign'

type Category = 'gyms' | 'train-stay' | 'seminars'

/**
 * Booking.com-style search strip: blue header band with the pill half overlapping below.
 * Used on search results and gym listing pages (matches homepage overlap on desktop).
 */
export function SiteSearchHeaderStrip({
  initialQuery = '',
  showCategoryTabs = true,
  className = '',
  category: controlledCategory,
  onCategoryChange,
}: {
  initialQuery?: string
  showCategoryTabs?: boolean
  className?: string
  category?: Category
  onCategoryChange?: (category: Category) => void
}) {
  const [internalCategory, setInternalCategory] = useState<Category>('gyms')
  const category = controlledCategory ?? internalCategory
  const setCategory = onCategoryChange ?? setInternalCategory

  return (
    <>
      <div
        className={`relative z-30 bg-white pt-4 pb-3 md:bg-[#003580] md:pt-6 md:pb-0 ${className}`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-4">
          {showCategoryTabs ? (
            <div className="hidden md:block">
              <CategoryTabs value={category} onChange={setCategory} />
            </div>
          ) : null}
          <div className="md:translate-y-1/2">
            <SearchBarRedesign
              showTabs={false}
              yellowBorder={true}
              activeCategory={category}
              initialQuery={initialQuery}
              onCategoryChange={setCategory}
            />
          </div>
        </div>
      </div>

      {/* White spacer — absorbs the bottom half of the pill on desktop */}
      <div className="bg-white pb-3 md:pt-12 md:pb-4" aria-hidden />
    </>
  )
}
