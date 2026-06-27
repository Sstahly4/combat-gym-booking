'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  TRAINING_SCHEDULE_DAYS,
  type TrainingSchedule,
  type TrainingScheduleDay,
  type TrainingScheduleSession,
  countTrainingScheduleSessions,
  mergeTrainingSchedules,
} from '@/lib/manage/training-schedule'
import { AlertCircle, CalendarDays, Check, Loader2, Upload, X } from 'lucide-react'

const DAY_LABELS: Record<TrainingScheduleDay, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

type ImportPhase = 'idle' | 'parsing' | 'review' | 'error'

export type TrainingScheduleImportPanelProps = {
  gymId: string
  currentSchedule: Record<string, TrainingScheduleSession[] | undefined>
  onApply: (schedule: TrainingSchedule) => void
  /** When true, show provider/debug detail returned by the API. */
  isAdmin?: boolean
}

const btnPrimary = 'bg-[#003580] text-white hover:bg-[#003580]/90'
const btnGhost = 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'

export function TrainingScheduleImportPanel({
  gymId,
  currentSchedule,
  onApply,
  isAdmin = false,
}: TrainingScheduleImportPanelProps) {
  const inputId = useId().replace(/:/g, '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<ImportPhase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [draft, setDraft] = useState<TrainingSchedule | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [adminErrorDetail, setAdminErrorDetail] = useState<string | null>(null)
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('replace')
  const [dragOver, setDragOver] = useState(false)

  const existingCount = useMemo(() => countTrainingScheduleSessions(currentSchedule), [currentSchedule])
  const draftCount = useMemo(() => (draft ? countTrainingScheduleSessions(draft) : 0), [draft])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const reset = useCallback(() => {
    setPhase('idle')
    setFile(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setDraft(null)
    setWarnings([])
    setError(null)
    setAdminErrorDetail(null)
    setDragOver(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const parseFile = useCallback(
    async (picked: File) => {
      setPhase('parsing')
      setError(null)
      setAdminErrorDetail(null)

      try {
        const formData = new FormData()
        formData.append('file', picked)

        const res = await fetch(`/api/manage/gym/${gymId}/parse-schedule`, {
          method: 'POST',
          body: formData,
        })

        let data: {
          error?: string
          detail?: string
          code?: string
          schedule?: TrainingSchedule
          warnings?: string[]
        } = {}
        try {
          data = (await res.json()) as typeof data
        } catch {
          throw new Error(
            res.status === 504
              ? 'Reading the timetable timed out — try a smaller or clearer photo.'
              : `Server error (${res.status}). Try again.`,
          )
        }

        if (!res.ok) {
          setAdminErrorDetail(isAdmin ? data.detail ?? null : null)
          throw new Error(data.error || 'Could not read this timetable.')
        }

        if (!data.schedule) {
          throw new Error('No schedule returned.')
        }

        setDraft(data.schedule)
        setWarnings(data.warnings ?? [])
        setApplyMode(existingCount > 0 ? 'merge' : 'replace')
        setPhase('review')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not read this timetable.')
        setPhase('error')
      }
    },
    [gymId, existingCount, isAdmin],
  )

  const handleFilePick = useCallback(
    (picked: File | null) => {
      if (!picked) return
      if (!picked.type.startsWith('image/')) {
        setError('Please choose an image file (PNG, JPEG, or WebP).')
        setPhase('error')
        return
      }
      if (picked.size > 10 * 1024 * 1024) {
        setError('Image must be 10 MB or smaller.')
        setPhase('error')
        return
      }

      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(picked)
      })
      setFile(picked)
      setDraft(null)
      setWarnings([])
      void parseFile(picked)
    },
    [parseFile],
  )

  const handleApply = () => {
    if (!draft) return
    const cleaned = { ...draft }
    for (const day of TRAINING_SCHEDULE_DAYS) {
      cleaned[day] = draft[day].filter((s) => s.time.trim())
    }
    if (countTrainingScheduleSessions(cleaned) === 0) {
      setError('Add at least one session with a time before continuing.')
      setPhase('error')
      return
    }

    const base = TRAINING_SCHEDULE_DAYS.reduce((acc, day) => {
      acc[day] = [...(currentSchedule[day] ?? [])]
      return acc
    }, {} as TrainingSchedule)

    const finalSchedule =
      applyMode === 'merge' ? mergeTrainingSchedules(base, cleaned) : cleaned

    onApply(finalSchedule)
    reset()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-gray-50/50 shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4 md:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-[#003580]">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Import schedule from photo</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload a weekly timetable to fill in class times.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 md:px-6 md:py-6">
        {phase === 'review' && draft ? (
          <>
            <p className="text-sm font-medium text-gray-900">Does this look right?</p>

            {warnings.length > 0 ? (
              <div className="rounded-lg border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                <p className="flex items-start gap-2 font-medium">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Please double-check
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-amber-800/90">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-700">
                Found{' '}
                <span className="font-semibold text-gray-900">{draftCount}</span> session
                {draftCount === 1 ? '' : 's'} — edit anything that looks off.
              </p>
              {existingCount > 0 ? (
                <div className="flex rounded-lg border border-gray-200 bg-white p-1 text-sm">
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      applyMode === 'merge'
                        ? 'bg-gray-50 text-[#003580] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    )}
                    onClick={() => setApplyMode('merge')}
                  >
                    Add to existing
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      applyMode === 'replace'
                        ? 'bg-gray-50 text-[#003580] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    )}
                    onClick={() => setApplyMode('replace')}
                  >
                    Replace all
                  </button>
                </div>
              ) : null}
            </div>

            <div className="max-h-[min(52vh,28rem)] space-y-3 overflow-y-auto overscroll-contain pr-1">
              {TRAINING_SCHEDULE_DAYS.map((day) => {
                const sessions = draft[day]
                if (sessions.length === 0) return null
                return (
                  <div
                    key={day}
                    className="rounded-lg border border-gray-200/90 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                      <p className="text-sm font-semibold text-gray-900">{DAY_LABELS[day]}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-[#003580]"
                        onClick={() => addSession(day, setDraft, draft)}
                      >
                        + Add
                      </Button>
                    </div>
                    <div className="space-y-2 p-3">
                      {sessions.map((session, index) => (
                        <SessionRow
                          key={`${day}-${index}`}
                          session={session}
                          onChange={(patch) => updateSession(day, index, patch, setDraft, draft)}
                          onRemove={() => removeSession(day, index, setDraft, draft)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className={btnGhost} onClick={reset}>
                Try another image
              </Button>
              <Button type="button" className={cn(btnPrimary, 'shadow-sm')} onClick={handleApply}>
                <Check className="mr-2 h-4 w-4" />
                Add to schedule
              </Button>
            </div>
          </>
        ) : (
          <>
            {previewUrl && (phase === 'parsing' || phase === 'error') ? (
              <div className="flex items-start gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-sm font-medium text-gray-900">{file?.name}</p>
                  {phase === 'parsing' ? (
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin text-[#003580]" aria-hidden />
                      Reading timetable…
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-xl border-2 border-dashed bg-white p-6 text-center transition-colors',
                  dragOver ? 'border-[#003580]/40 bg-[#003580]/[0.03]' : 'border-gray-200',
                  phase === 'parsing' && 'pointer-events-none opacity-60',
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  handleFilePick(e.dataTransfer.files?.[0] ?? null)
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id={inputId}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={phase === 'parsing'}
                  onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor={inputId}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2',
                    phase === 'parsing' && 'cursor-wait',
                  )}
                >
                  <Upload className="h-9 w-9 text-gray-400" aria-hidden />
                  <span className="text-sm font-semibold text-gray-900">
                    Drop timetable image here
                  </span>
                  <span className="max-w-md text-xs text-muted-foreground">
                    Weekly grid, poster, or Instagram screenshot · PNG or JPEG · max 10 MB
                  </span>
                </label>
              </div>
            )}

            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p>{error}</p>
                  {isAdmin && adminErrorDetail ? (
                    <p className="mt-2 rounded-md border border-red-200/80 bg-white/70 px-2.5 py-2 font-mono text-xs text-red-900">
                      Admin detail: {adminErrorDetail}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium underline"
                    onClick={reset}
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : null}

            {existingCount === 0 && phase === 'idle' ? (
              <p className="text-xs text-muted-foreground">
                Or skip the upload and enter sessions manually below.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function SessionRow({
  session,
  onChange,
  onRemove,
}: {
  session: TrainingScheduleSession
  onChange: (patch: Partial<TrainingScheduleSession>) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-md border border-gray-100 bg-gray-50/60 p-2.5 sm:grid-cols-[1fr_1fr_auto]">
      <div className="space-y-1">
        <Label className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Time
        </Label>
        <Input
          value={session.time}
          onChange={(e) => onChange({ time: e.target.value })}
          placeholder="e.g. 06:00-08:00"
          className="h-9 border-gray-200 bg-white text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Class
        </Label>
        <Input
          value={session.type ?? ''}
          onChange={(e) => onChange({ type: e.target.value })}
          placeholder="e.g. Muay Thai"
          className="h-9 border-gray-200 bg-white text-sm"
        />
      </div>
      <div className="flex items-end sm:pb-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onRemove}
          aria-label="Remove session"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function updateSession(
  day: TrainingScheduleDay,
  index: number,
  patch: Partial<TrainingScheduleSession>,
  setDraft: React.Dispatch<React.SetStateAction<TrainingSchedule | null>>,
  draft: TrainingSchedule | null,
) {
  if (!draft) return
  const next = { ...draft, [day]: [...draft[day]] }
  next[day][index] = { ...next[day][index], ...patch }
  setDraft(next)
}

function removeSession(
  day: TrainingScheduleDay,
  index: number,
  setDraft: React.Dispatch<React.SetStateAction<TrainingSchedule | null>>,
  draft: TrainingSchedule | null,
) {
  if (!draft) return
  setDraft({ ...draft, [day]: draft[day].filter((_, i) => i !== index) })
}

function addSession(
  day: TrainingScheduleDay,
  setDraft: React.Dispatch<React.SetStateAction<TrainingSchedule | null>>,
  draft: TrainingSchedule | null,
) {
  if (!draft) return
  setDraft({ ...draft, [day]: [...draft[day], { time: '', type: '' }] })
}
