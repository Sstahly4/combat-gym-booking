'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  GYM_AMENITY_CATEGORIES,
  GYM_AMENITY_BY_CATEGORY,
  GYM_AMENITY_ORDER,
  countEnabledAmenities,
  labelGymAmenity,
  searchGymAmenityKeys,
  type GymAmenityCategoryId,
} from '@/lib/constants/gym-amenities'
import { cn } from '@/lib/utils'

export function GymAmenitiesEditor({
  amenities,
  onChange,
}: {
  amenities: Record<string, boolean>
  onChange: (key: string, enabled: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<GymAmenityCategoryId | 'all'>('all')

  const selectedCount = countEnabledAmenities(amenities)
  const selectedKeys = useMemo(
    () => GYM_AMENITY_ORDER.filter((k) => amenities[k]),
    [amenities],
  )

  const searchResults = useMemo(() => searchGymAmenityKeys(query), [query])
  const isSearching = query.trim().length > 0

  const visibleCategories = useMemo(() => {
    if (expandedCategory === 'all') return GYM_AMENITY_CATEGORIES
    return GYM_AMENITY_CATEGORIES.filter((c) => c.id === expandedCategory)
  }, [expandedCategory])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          Add everything your gym offers. Guests can filter search by amenities, so a complete list
          helps you get found.
        </p>
        <p className="text-sm font-medium text-gray-900">
          {selectedCount} {selectedCount === 1 ? 'amenity' : 'amenities'} selected
        </p>
      </div>

      {selectedKeys.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key, false)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#003580]/20 bg-[#003580]/[0.06] px-3 py-1.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-[#003580]/10"
            >
              <span className="truncate">{labelGymAmenity(key)}</span>
              <X className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden />
              <span className="sr-only">Remove {labelGymAmenity(key)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-5 text-sm text-gray-500">
          No amenities added yet. Browse categories below or search by name.
        </div>
      )}

      <div className="relative max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search amenities"
          className="pl-9"
          aria-label="Search amenities"
        />
      </div>

      {!isSearching ? (
        <div className="flex flex-wrap gap-2">
          <CategoryFilterChip
            active={expandedCategory === 'all'}
            onClick={() => setExpandedCategory('all')}
            label="All categories"
          />
          {GYM_AMENITY_CATEGORIES.map((cat) => {
            const count = GYM_AMENITY_BY_CATEGORY[cat.id].filter((k) => amenities[k]).length
            return (
              <CategoryFilterChip
                key={cat.id}
                active={expandedCategory === cat.id}
                onClick={() => setExpandedCategory(cat.id)}
                label={count > 0 ? `${cat.label} (${count})` : cat.label}
              />
            )
          })}
        </div>
      ) : null}

      <div className="space-y-8">
        {isSearching ? (
          <AmenityCategoryBlock
            title={`Results for “${query.trim()}”`}
            description={searchResults.length === 0 ? 'No matching amenities.' : undefined}
            keys={searchResults}
            amenities={amenities}
            onChange={onChange}
          />
        ) : (
          visibleCategories.map((cat) => (
            <AmenityCategoryBlock
              key={cat.id}
              title={cat.label}
              description={cat.description}
              keys={GYM_AMENITY_BY_CATEGORY[cat.id]}
              amenities={amenities}
              onChange={onChange}
            />
          ))
        )}
      </div>
    </div>
  )
}

function CategoryFilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-[#003580] bg-[#003580] text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
      )}
    >
      {label}
    </button>
  )
}

function AmenityCategoryBlock({
  title,
  description,
  keys,
  amenities,
  onChange,
}: {
  title: string
  description?: string
  keys: string[]
  amenities: Record<string, boolean>
  onChange: (key: string, enabled: boolean) => void
}) {
  if (keys.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-0.5 text-sm text-gray-500">{description}</p> : null}
      </div>
      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200/90 bg-white">
        {keys.map((key) => {
          const enabled = amenities[key]
          return (
            <li key={key} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0 text-sm text-gray-900">{labelGymAmenity(key)}</span>
              {enabled ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(key, false)}
                  className="shrink-0"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(key, true)}
                  className="shrink-0 gap-1"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
