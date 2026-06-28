'use client'

import type { ChangeEvent, DragEvent } from 'react'
import { ImagePlus, LayoutGrid, Plus, X } from 'lucide-react'
import type { GymImage } from '@/lib/types/database'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'
import { GymPhotoTourCarousel } from '@/components/manage/gym-photo-tour-carousel'
import type { GymPhotoTourDisplayItem } from '@/components/manage/gym-photo-tour-types'
import { cn } from '@/lib/utils'

export type { GymPhotoTourDisplayItem } from '@/components/manage/gym-photo-tour-types'

type GymPhotoTourProps = {
  items: GymPhotoTourDisplayItem[]
  maxPhotos?: number
  imageDragEnabled: boolean
  draggedIndex: number | null
  pendingPreviewUrls: Record<string, string>
  onAddPhotos: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: (item: GymPhotoTourDisplayItem) => void
  onFocus?: (image: GymImage) => void
  onDragStart: (index: number) => void
  onDragOver: (event: DragEvent) => void
  onDrop: (event: DragEvent, dropIndex: number) => void
}

const PHOTO_TILE_SURFACE =
  'relative aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-black/[0.06] transition-all duration-300'

function PhotoTile({
  item,
  imageDragEnabled,
  isDragging,
  pendingPreviewUrls,
  onRemove,
  onFocus,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: GymPhotoTourDisplayItem
  imageDragEnabled: boolean
  isDragging: boolean
  pendingPreviewUrls: Record<string, string>
  onRemove: () => void
  onFocus?: () => void
  onDragStart: () => void
  onDragOver: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}) {
  const isFailed = item.kind === 'pending' && item.pending.status === 'failed'
  const photoLabel =
    item.index === 0 ? 'Cover photo' : `Photo ${item.index + 1}`

  return (
    <div
      draggable={imageDragEnabled}
      onDragStart={imageDragEnabled ? onDragStart : undefined}
      onDragOver={imageDragEnabled ? onDragOver : undefined}
      onDrop={imageDragEnabled ? onDrop : undefined}
      className={cn(
        PHOTO_TILE_SURFACE,
        'group touch-manipulation hover:shadow-md hover:ring-black/[0.08]',
        imageDragEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isDragging && 'scale-[0.98] opacity-60 ring-2 ring-[#003580] ring-offset-2',
        isFailed && 'ring-2 ring-red-300',
      )}
    >
      <div className="absolute inset-0">
        {item.kind === 'saved' ? (
          <ResponsiveGymImage
            image={item.image}
            alt="Gym photo"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            context="hero"
            aspect="fill"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <img
            src={
              item.kind === 'transition'
                ? item.previewUrl
                : pendingPreviewUrls[item.pending.id] ?? item.pending.previewUrl
            }
            alt="Photo preview"
            className="pointer-events-none h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      {item.index === 0 ? (
        <div className="absolute left-3 top-3 z-20 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm">
          Cover
        </div>
      ) : (
        <div className="absolute bottom-3 left-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
          {photoLabel}
        </div>
      )}

      <button
        type="button"
        onPointerDown={(ev) => ev.stopPropagation()}
        onClick={onRemove}
        className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-sm opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-white touch-manipulation"
        aria-label="Remove photo"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      {item.kind === 'saved' && onFocus ? (
        <button
          type="button"
          onPointerDown={(ev) => ev.stopPropagation()}
          onClick={onFocus}
          className="absolute bottom-3 right-3 z-20 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-white"
        >
          Focus
        </button>
      ) : null}
    </div>
  )
}

/** Airbnb-style photo tour grid for the listing editor. */
export function GymPhotoTour({
  items,
  maxPhotos = 30,
  imageDragEnabled,
  draggedIndex,
  pendingPreviewUrls,
  onAddPhotos,
  onRemove,
  onFocus,
  onDragStart,
  onDragOver,
  onDrop,
}: GymPhotoTourProps) {
  const atLimit = items.length >= maxPhotos
  const addInputId = 'gym-photo-tour-add'

  return (
    <div id="gym-photo-tour" className="space-y-8">
      {items.length > 0 ? (
        <>
          <GymPhotoTourCarousel items={items} pendingPreviewUrls={pendingPreviewUrls} />

          <div
            id="gym-photo-tour-grid"
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
          {items.map((item) => (
            <PhotoTile
              key={item.key}
              item={item}
              imageDragEnabled={imageDragEnabled}
              isDragging={draggedIndex === item.index}
              pendingPreviewUrls={pendingPreviewUrls}
              onRemove={() => onRemove(item)}
              onFocus={
                item.kind === 'saved' && onFocus ? () => onFocus(item.image) : undefined
              }
              onDragStart={() => onDragStart(item.index)}
              onDragOver={onDragOver}
              onDrop={(event) => onDrop(event, item.index)}
            />
          ))}

          {!atLimit ? (
            <label
              htmlFor={addInputId}
              className={cn(
                PHOTO_TILE_SURFACE,
                'flex cursor-pointer flex-col items-center justify-center gap-2.5 border-2 border-dashed border-gray-200/90 bg-gray-50/60 text-gray-500',
                'hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 hover:shadow-md',
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]">
                <Plus className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-medium">Add photos</span>
            </label>
          ) : null}
          </div>
        </>
      ) : (
        <label
          htmlFor={addInputId}
          className="flex min-h-[min(50vh,22rem)] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 text-center transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <ImagePlus className="h-6 w-6 text-gray-700" aria-hidden />
          </span>
          <div>
            <p className="text-base font-semibold text-gray-900">Add your first photos</p>
            <p className="mt-1 text-sm text-gray-500">
              Upload clear shots of your gym, mats, and training space. The first photo becomes your cover.
            </p>
          </div>
        </label>
      )}

      <input
        id={addInputId}
        type="file"
        accept="image/*"
        multiple
        onChange={onAddPhotos}
        disabled={atLimit}
        className="sr-only"
      />

      {items.length > 0 && imageDragEnabled ? (
        <p className="text-center text-sm text-gray-500 md:text-left">
          Drag photos to reorder — the first image is your cover on search.
        </p>
      ) : null}
    </div>
  )
}

/** Header actions for the photo tour section (All photos + add). */
export function GymPhotoTourHeaderActions({
  photoCount,
  maxPhotos = 30,
  onAddPhotos,
}: {
  photoCount: number
  maxPhotos?: number
  onAddPhotos: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const atLimit = photoCount >= maxPhotos
  const addInputId = 'gym-photo-tour-header-add'

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => {
          document.getElementById('gym-photo-tour-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
      >
        <LayoutGrid className="h-4 w-4 text-gray-600" aria-hidden />
        All photos
        {photoCount > 0 ? (
          <span className="tabular-nums text-gray-500">({photoCount})</span>
        ) : null}
      </button>

      <label
        htmlFor={addInputId}
        className={cn(
          'inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition-colors hover:bg-gray-50',
          atLimit && 'cursor-not-allowed opacity-50',
        )}
      >
        <Plus className="h-5 w-5" aria-hidden />
        <span className="sr-only">Add photos</span>
      </label>
      <input
        id={addInputId}
        type="file"
        accept="image/*"
        multiple
        onChange={onAddPhotos}
        disabled={atLimit}
        className="sr-only"
      />
    </div>
  )
}
