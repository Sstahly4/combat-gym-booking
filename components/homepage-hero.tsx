'use client'

import { useMemo, useState } from 'react'
import { CategoryTabs } from '@/components/category-tabs'
import { SearchBarRedesign } from '@/components/search-bar-redesign'

type Category = 'gyms' | 'train-stay' | 'seminars'

export function HomepageHero() {
  const [category, setCategory] = useState<Category>('gyms')
  const [showCampsWithAccommodation, setShowCampsWithAccommodation] = useState(false)

  const headline = useMemo(() => {
    if (category === 'seminars') return "Where's Your Next Seminar?"
    return category === 'train-stay'
      ? "Where's Your Next Training Stay?"
      : "Where's Your Next Fight Camp?"
  }, [category])

  const subtitle = useMemo(() => {
    if (category === 'seminars') return 'Learn from world-class coaches at seminars and workshops worldwide.'
    if (category === 'train-stay') return 'Find camps that include accommodation — train hard, sleep well.'
    return 'Search for authentic Muay Thai, MMA, and BJJ gyms worldwide.'
  }, [category])

  return (
    <div className="relative z-20 bg-[#003580] pt-10 pb-0 md:pt-14">
      <div className="max-w-6xl mx-auto px-4">
        {/* Left-aligned headline + subtitle */}
        <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4 tracking-tight text-white">
          {headline}
        </h1>
        <p className="text-base md:text-lg text-white/70 font-light mb-8 md:mb-10">
          {subtitle}
        </p>

        {/* Category tabs + search bar — full width of content, tabs and checkbox aligned to search bar */}
        <div className="w-full">
          <CategoryTabs value={category} onChange={setCategory} />
          <div className="translate-y-1/2">
            <SearchBarRedesign
              showTabs={false}
              yellowBorder={true}
              activeCategory={category}
              accommodationOnly={showCampsWithAccommodation}
            />
          </div>
        </div>
      </div>

      {/* White section below — aligned to search bar */}
      <div className="bg-white pt-14 pb-2">
        <div className="max-w-6xl mx-auto px-4">
          <div className="w-full">
            <label className="flex items-center gap-2 cursor-pointer pl-6">
              <input
                type="checkbox"
                checked={showCampsWithAccommodation}
                onChange={(e) => setShowCampsWithAccommodation(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#003580] focus:ring-[#003580]"
              />
              <span className="text-sm text-gray-600">Show fight camps with accommodation</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
