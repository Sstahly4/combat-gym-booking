'use client'

import { useId, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { managedImageDisplayUrl } from '@/lib/images/gym-image-variants'
import { ImageIcon, Upload, X } from 'lucide-react'

export type GymScheduleDisplayMode = 'manual' | 'photo'

export function GymScheduleModePicker({
  mode,
  onModeChange,
}: {
  mode: GymScheduleDisplayMode
  onModeChange: (mode: GymScheduleDisplayMode) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onModeChange('manual')}
        className={cn(
          'rounded-xl border px-4 py-3 text-left transition-colors',
          mode === 'manual'
            ? 'border-[#003580] bg-[#003580]/5 ring-1 ring-[#003580]/20'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
        )}
      >
        <p className="text-sm font-semibold text-gray-900">Enter class times</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Structured schedule — best for search cards and the interactive class picker.
        </p>
      </button>
      <button
        type="button"
        onClick={() => onModeChange('photo')}
        className={cn(
          'rounded-xl border px-4 py-3 text-left transition-colors',
          mode === 'photo'
            ? 'border-[#003580] bg-[#003580]/5 ring-1 ring-[#003580]/20'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
        )}
      >
        <p className="text-sm font-semibold text-gray-900">Upload timetable photo</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Drop your weekly flyer or screenshot — we show it as-is on your profile. No typing.
        </p>
      </button>
    </div>
  )
}

export function GymSchedulePhotoUpload({
  savedImageRef,
  pendingFile,
  pendingPreviewUrl,
  onPickFile,
  onClear,
  disabled,
}: {
  savedImageRef: string | null
  pendingFile: File | null
  pendingPreviewUrl: string | null
  onPickFile: (file: File) => void
  onClear: () => void
  disabled?: boolean
}) {
  const inputId = useId().replace(/:/g, '')
  const inputRef = useRef<HTMLInputElement>(null)

  const displaySrc =
    pendingPreviewUrl ?? (savedImageRef ? managedImageDisplayUrl(savedImageRef) : null)

  const handlePick = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPEG, or WebP).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be 10 MB or smaller.')
      return
    }
    onPickFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClear = () => {
    onClear()
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-gray-50/50 shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Timetable image</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Guests see this on your gym profile. Use a clear weekly grid or poster — PNG or JPEG works
          best.
        </p>
      </div>
      <div className="space-y-4 p-5">
        {displaySrc ? (
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
            <img
              src={displaySrc}
              alt="Weekly timetable preview"
              className="max-h-[min(420px,55vh)] w-full object-contain"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={handleClear}
              className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white hover:bg-red-600 disabled:opacity-50"
              aria-label="Remove timetable image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white py-10 text-center">
            <ImageIcon className="mb-2 h-9 w-9 text-gray-300" aria-hidden />
            <p className="text-sm font-medium text-gray-800">No timetable uploaded yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Upload the same image you post on Instagram or your website.
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          className="border-gray-200 bg-white sm:w-auto"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {displaySrc ? 'Replace image' : 'Choose image'}
        </Button>

        {pendingFile ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-gray-700">{pendingFile.name}</span> — saves when you
            save your gym profile.
          </p>
        ) : savedImageRef && !pendingFile ? (
          <p className="text-xs text-muted-foreground">Current timetable is saved on your listing.</p>
        ) : null}
      </div>
    </div>
  )
}
