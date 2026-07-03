'use client'

import { useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GymEditPanel, GymEditSection } from '@/components/manage/gym-edit-section'
import {
  GYM_AMENITY_CATEGORIES,
  GYM_AMENITY_BY_CATEGORY,
  GYM_AMENITY_ORDER,
  GYM_AMENITY_PRIORITY_KEYS,
  countEnabledAmenities,
  labelGymAmenity,
  searchGymAmenityKeys,
  type GymAmenityCategoryId,
} from '@/lib/constants/gym-amenities'
import { GymAmenitiesPreview } from '@/components/manage/gym-amenities-preview'
import { cn } from '@/lib/utils'

const SELECTED_PREVIEW_LIMIT = 8

export function GymAmenitiesEditor({
  amenities,
  onChange,
}: {
  amenities: Record<string, boolean>
  onChange: (key: string, enabled: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [openCategoryId, setOpenCategoryId] = useState<GymAmenityCategoryId | 'all' | null>('basics')
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(22rem,34%)] lg:items-start xl:gap-8">
      <GymEditPanel>
        <GymEditSection
          title="Popular amenities"
          description="The essentials guests look for first — tap to add or remove."
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GYM_AMENITY_PRIORITY_KEYS.map((key) => {
              const enabled = amenities[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key, !enabled)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ring-1',
                    enabled
                      ? 'bg-[#003580]/[0.06] text-gray-900 ring-[#003580]/20'
                      : 'bg-white text-gray-700 ring-black/[0.04] hover:bg-gray-50',
                  )}
                >
                  <span className="font-medium">{labelGymAmenity(key)}</span>
                  {enabled ? (
                    <Check className="h-4 w-4 shrink-0 text-[#003580]" aria-hidden />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  )}
                </button>
              )
            })}
          </div>
        </GymEditSection>

        <GymEditSection
          title="Your selection"
          description={
            selectedCount > 0
              ? `${selectedCount} ${selectedCount === 1 ? 'amenity' : 'amenities'} on your listing.`
              : 'Nothing selected yet — start with popular amenities or browse categories below.'
          }
        >
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all amenities"
              className="pl-9"
              aria-label="Search amenities"
            />
          </div>

          {selectedCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedKeys.slice(0, SELECTED_PREVIEW_LIMIT).map((key) => (
                <SelectedAmenityChip key={key} amenityKey={key} onRemove={() => onChange(key, false)} />
              ))}
              {selectedKeys.length > SELECTED_PREVIEW_LIMIT ? (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600">
                  +{selectedKeys.length - SELECTED_PREVIEW_LIMIT} more
                </span>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-500">
              Selected amenities appear here as chips you can remove quickly.
            </div>
          )}
        </GymEditSection>

        <GymEditSection
          title="All categories"
          description="Browse everything else — training areas, recovery, travel support, and more."
        >
          {!isSearching ? (
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
          ) : null}

          <div className="space-y-3">
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
                    className="overflow-hidden rounded-xl ring-1 ring-black/[0.04]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenCategoryId(isOpen ? null : cat.id)}
                      className="flex w-full items-center justify-between gap-3 bg-gray-50/80 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
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
                      <ul className="divide-y divide-gray-100 border-t border-gray-100 bg-white">
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
        </GymEditSection>
      </GymEditPanel>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <GymAmenitiesPreview amenities={amenities} />
      </aside>
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
    <section className="overflow-hidden rounded-xl ring-1 ring-black/[0.04]">
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? <p className="mt-0.5 text-sm text-gray-500">{description}</p> : null}
      </div>
      <ul className="divide-y divide-gray-100 bg-white">
        {keys.map((key) => (
          <AmenityListRow key={key} amenityKey={key} enabled={amenities[key]} onChange={onChange} />
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
