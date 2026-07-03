'use client'

import { useEffect, useId, useRef } from 'react'
import { Loader2, Plus, Upload, UserRound, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { listingSectionClass } from '@/components/manage/gym-edit-section'
import { cn } from '@/lib/utils'

export type TrainerFormRow = {
  clientKey: string
  name: string
  discipline: string
  experience: string
  photo_url?: string | null
  description?: string
}

export function newTrainerClientKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `trainer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeTrainerRow(raw: unknown): TrainerFormRow {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    clientKey: typeof row.clientKey === 'string' ? row.clientKey : newTrainerClientKey(),
    name: typeof row.name === 'string' ? row.name : '',
    discipline: typeof row.discipline === 'string' ? row.discipline : '',
    experience: typeof row.experience === 'string' ? row.experience : '',
    photo_url: typeof row.photo_url === 'string' ? row.photo_url : null,
    description: typeof row.description === 'string' ? row.description : '',
  }
}

export type TrainerPhotoDisplay = {
  src: string | null
  uploading: boolean
  failed: boolean
}

type GymTrainersEditorProps = {
  trainers: TrainerFormRow[]
  getPhotoDisplay: (trainer: TrainerFormRow) => TrainerPhotoDisplay
  onAdd: () => void
  onRemove: (clientKey: string) => void
  onUpdate: (clientKey: string, field: Exclude<keyof TrainerFormRow, 'clientKey'>, value: string) => void
  onPhotoFile: (clientKey: string, file: File | null) => void
  /** Increment to trigger add from a parent header action. */
  addSignal?: number
}

const ADD_TILE_CLASS =
  'flex min-h-[17.5rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 text-center transition-colors hover:border-gray-300 hover:bg-gray-50'

function TrainerCard({
  trainer,
  index,
  photo,
  photoInputId,
  onRemove,
  onUpdate,
  onPhotoFile,
}: {
  trainer: TrainerFormRow
  index: number
  photo: TrainerPhotoDisplay
  photoInputId: string
  onRemove: (clientKey: string) => void
  onUpdate: GymTrainersEditorProps['onUpdate']
  onPhotoFile: GymTrainersEditorProps['onPhotoFile']
}) {
  const displayName = trainer.name.trim() || `Trainer ${index + 1}`

  return (
    <article className={cn(listingSectionClass, 'flex flex-col overflow-hidden p-0')}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {photo.src ? (
          <img
            src={photo.src}
            alt={trainer.name ? `${trainer.name} photo` : 'Trainer photo'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
            <UserRound className="h-10 w-10" aria-hidden />
            <span className="text-xs font-medium text-gray-400">No photo</span>
          </div>
        )}

        {photo.uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-[#003580]" aria-hidden />
          </div>
        ) : null}

        {photo.failed ? (
          <span className="absolute inset-x-0 bottom-0 bg-red-600/90 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white">
            Upload failed
          </span>
        ) : null}

        <label
          htmlFor={photoInputId}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/35 hover:opacity-100"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm">
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {photo.src ? 'Change photo' : 'Add photo'}
          </span>
        </label>

        <input
          id={photoInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            onPhotoFile(trainer.clientKey, file)
            e.target.value = ''
          }}
        />

        {photo.src ? (
          <button
            type="button"
            onClick={() => {
              onPhotoFile(trainer.clientKey, null)
              onUpdate(trainer.clientKey, 'photo_url', '')
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-sm transition-colors hover:bg-white"
            aria-label={`Remove photo for ${displayName}`}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">{displayName}</h3>
            {trainer.discipline.trim() ? (
              <p className="mt-0.5 truncate text-sm text-gray-500">{trainer.discipline}</p>
            ) : (
              <p className="mt-0.5 text-sm text-gray-400">Add discipline below</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(trainer.clientKey)}
            className="shrink-0 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            Remove
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="space-y-2 py-4 first:pt-0">
            <Label htmlFor={`trainer-name-${trainer.clientKey}`} className="text-sm font-medium text-gray-900">
              Name
            </Label>
            <Input
              id={`trainer-name-${trainer.clientKey}`}
              placeholder="e.g. Coach Somchai"
              value={trainer.name}
              onChange={(e) => onUpdate(trainer.clientKey, 'name', e.target.value)}
            />
          </div>

          <div className="space-y-2 py-4">
            <Label htmlFor={`trainer-discipline-${trainer.clientKey}`} className="text-sm font-medium text-gray-900">
              Discipline
            </Label>
            <Input
              id={`trainer-discipline-${trainer.clientKey}`}
              placeholder="e.g. Muay Thai, Boxing"
              value={trainer.discipline}
              onChange={(e) => onUpdate(trainer.clientKey, 'discipline', e.target.value)}
            />
          </div>

          <div className="space-y-2 py-4">
            <Label htmlFor={`trainer-experience-${trainer.clientKey}`} className="text-sm font-medium text-gray-900">
              Experience
            </Label>
            <Input
              id={`trainer-experience-${trainer.clientKey}`}
              placeholder="e.g. 12 years coaching, former stadium fighter"
              value={trainer.experience}
              onChange={(e) => onUpdate(trainer.clientKey, 'experience', e.target.value)}
            />
          </div>

          <div className="space-y-2 py-4 last:pb-0">
            <Label htmlFor={`trainer-bio-${trainer.clientKey}`} className="text-sm font-medium text-gray-900">
              Bio
            </Label>
            <Textarea
              id={`trainer-bio-${trainer.clientKey}`}
              placeholder="Short bio, specialties, titles, coaching style…"
              value={trainer.description || ''}
              onChange={(e) => onUpdate(trainer.clientKey, 'description', e.target.value)}
              rows={3}
              className="min-h-[5.5rem] resize-y"
            />
          </div>
        </div>
      </div>
    </article>
  )
}

/** Grid editor for coach profiles on the listing trainers section. */
export function GymTrainersEditor({
  trainers,
  getPhotoDisplay,
  onAdd,
  onRemove,
  onUpdate,
  onPhotoFile,
  addSignal = 0,
}: GymTrainersEditorProps) {
  const idPrefix = useId().replace(/:/g, '')
  const onAddRef = useRef(onAdd)
  onAddRef.current = onAdd

  useEffect(() => {
    if (addSignal > 0) onAddRef.current()
  }, [addSignal])

  if (trainers.length === 0) {
    return (
      <button type="button" onClick={onAdd} className={ADD_TILE_CLASS}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
          <UserRound className="h-6 w-6 text-gray-700" aria-hidden />
        </span>
        <div>
          <p className="text-base font-semibold text-gray-900">Add your first trainer</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Coach profiles appear on your public listing — name, photo, discipline, and a short bio.
          </p>
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Photos upload in the background — save anytime.
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {trainers.map((trainer, index) => (
          <TrainerCard
            key={trainer.clientKey}
            trainer={trainer}
            index={index}
            photo={getPhotoDisplay(trainer)}
            photoInputId={`${idPrefix}-photo-${trainer.clientKey}`}
            onRemove={onRemove}
            onUpdate={onUpdate}
            onPhotoFile={onPhotoFile}
          />
        ))}

        <button type="button" onClick={onAdd} className={ADD_TILE_CLASS}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]">
            <Plus className="h-5 w-5 text-gray-700" aria-hidden />
          </span>
          <span className="text-sm font-medium text-gray-700">Add trainer</span>
        </button>
      </div>
    </div>
  )
}
