'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Plus, Search, X } from 'lucide-react'
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
import { GymAmenitiesPreview } from '@/components/manage/gym-amenities-preview'
import { cn } from '@/lib/utils'

const SELECTED_PREVIEW_LIMIT = 6

export function GymAmenitiesEditor({
  amenities,
  onChange,
}: {
  amenities: Record<string, boolean>
  onChange: (key: string, enabled: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [openCategoryId, setOpenCategoryId] = useState<GymAmenityCategoryId | null>(null)
  const [selectedOpen, setSelectedOpen] = useState(false)
  const categoryRefs = useRef<Partial<Record<GymAmenityCategoryId, HTMLElement | null>>>({})

  const selectedCount = countEnabledAmenities(amenities)
  const selectedKeys = useMemo(
    () => GYM_AMENITY_ORDER.filter((k) => amenities[k]),
    [amenities],
  )

  const searchResults = useMemo(() => searchGymAmenityKeys(query), [query])
  const isSearching = query.trim().length > 0

  const jumpToCategory = (categoryId: GymAmenityCategoryId) => {
    setOpenCategoryId(categoryId)
    requestAnimationFrame(() => {
      categoryRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-14">
      <div className="flex flex-col gap-6">
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

      {selectedCount > 0 ? (
        <div className="rounded-xl border border-gray-200/90 bg-gray-50/40">
          <button
            type="button"
            onClick={() => setSelectedOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={selectedOpen}
          >
            <span className="text-sm font-medium text-gray-900">
              {selectedCount} {selectedCount === 1 ? 'amenity' : 'amenities'} selected
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
              {selectedOpen ? 'Hide' : 'View & remove'}
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', selectedOpen && 'rotate-180')}
                aria-hidden
              />
            </span>
          </button>

          {!selectedOpen ? (
            <div className="flex flex-wrap gap-2 border-t border-gray-200/80 px-4 py-3">
              {selectedKeys.slice(0, SELECTED_PREVIEW_LIMIT).map((key) => (
                <SelectedAmenityChip key={key} amenityKey={key} onRemove={() => onChange(key, false)} />
              ))}
              {selectedKeys.length > SELECTED_PREVIEW_LIMIT ? (
                <button
                  type="button"
                  onClick={() => setSelectedOpen(true)}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                >
                  +{selectedKeys.length - SELECTED_PREVIEW_LIMIT} more
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 border-t border-gray-200/80 px-4 py-3">
              {selectedKeys.map((key) => (
                <SelectedAmenityChip key={key} amenityKey={key} onRemove={() => onChange(key, false)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-4 text-sm text-gray-500">
          No amenities added yet. Open a category below or search by name.
        </div>
      )}

      {!isSearching ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Categories</p>
          <div className="flex flex-wrap gap-2">
            {GYM_AMENITY_CATEGORIES.map((cat) => {
              const count = GYM_AMENITY_BY_CATEGORY[cat.id].filter((k) => amenities[k]).length
              return (
                <CategoryFilterChip
                  key={cat.id}
                  active={openCategoryId === cat.id}
                  onClick={() => jumpToCategory(cat.id)}
                  label={count > 0 ? `${cat.label} (${count})` : cat.label}
                />
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {isSearching ? (
          <AmenityCategoryBlock
            title={`Results for “${query.trim()}”`}
            description={searchResults.length === 0 ? 'No matching amenities.' : undefined}
            keys={searchResults}
            amenities={amenities}
            onChange={onChange}
          />
        ) : (
          GYM_AMENITY_CATEGORIES.map((cat) => {
            const keys = GYM_AMENITY_BY_CATEGORY[cat.id]
            const selectedInCategory = keys.filter((k) => amenities[k]).length
            const isOpen = openCategoryId === cat.id

            return (
              <section
                key={cat.id}
                ref={(node) => {
                  categoryRefs.current[cat.id] = node
                }}
                className="overflow-hidden rounded-xl border border-gray-200/90 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenCategoryId(isOpen ? null : cat.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50/80"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{cat.label}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {selectedInCategory > 0
                        ? `${selectedInCategory} of ${keys.length} added`
                        : cat.description}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-gray-400 transition-transform',
                      isOpen && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen ? (
                  <ul className="divide-y divide-gray-100 border-t border-gray-100">
                    {keys.map((key) => (
                      <AmenityListRow
                        key={key}
                        amenityKey={key}
                        enabled={amenities[key]}
                        onChange={onChange}
                      />
                    ))}
                  </ul>
                ) : null}
              </section>
            )
          })
        )}
      </div>
      </div>

      <div className="lg:hidden">
        <GymAmenitiesPreview amenities={amenities} />
      </div>

      <div className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
        <GymAmenitiesPreview amenities={amenities} />
      </div>
    </div>
  )
}

function SelectedAmenityChip({
  amenityKey,
  onRemove,
}: {
  amenityKey: string
  onRemove: () => void
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#003580]/20 bg-[#003580]/[0.06] px-3 py-1.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-[#003580]/10"
    >
      <span className="truncate">{labelGymAmenity(amenityKey)}</span>
      <X className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden />
      <span className="sr-only">Remove {labelGymAmenity(amenityKey)}</span>
    </button>
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
    <section className="overflow-hidden rounded-xl border border-gray-200/90 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-0.5 text-sm text-gray-500">{description}</p> : null}
      </div>
      <ul className="divide-y divide-gray-100">
        {keys.map((key) => (
          <AmenityListRow
            key={key}
            amenityKey={key}
            enabled={amenities[key]}
            onChange={onChange}
          />
        ))}
      </ul>
    </section>
  )
}

function AmenityListRow({
  amenityKey,
  enabled,
  onChange,
}: {
  amenityKey: string
  enabled: boolean
  onChange: (key: string, enabled: boolean) => void
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0 text-sm text-gray-900">{labelGymAmenity(amenityKey)}</span>
      {enabled ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(amenityKey, false)}
          className="shrink-0"
        >
          Remove
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(amenityKey, true)}
          className="shrink-0 gap-1"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add
        </Button>
      )}
    </li>
  )
}
