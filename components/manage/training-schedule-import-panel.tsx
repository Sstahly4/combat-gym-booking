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
import {
  AlertCircle,
  Check,
  ImageIcon,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'

const DAY_LABELS: Record<TrainingScheduleDay, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

type ImportPhase = 'idle' | 'ready' | 'parsing' | 'review' | 'error'

export type TrainingScheduleImportPanelProps = {
  gymId: string
  currentSchedule: Record<string, TrainingScheduleSession[] | undefined>
  onApply: (schedule: TrainingSchedule, mode: 'replace' | 'merge') => void
  /** When true, panel starts collapsed — for optional AI auto-fill. */
  collapsible?: boolean
}

const sectionCard =
  'overflow-hidden rounded-xl border border-[#003580]/15 bg-gradient-to-b from-[#003580]/[0.04] to-white shadow-sm'
const btnPrimary = 'bg-[#003580] text-white hover:bg-[#003580]/90'
const btnGhost = 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'

export function TrainingScheduleImportPanel({
  gymId,
  currentSchedule,
  onApply,
  collapsible = false,
}: TrainingScheduleImportPanelProps) {
  const [expanded, setExpanded] = useState(!collapsible)
  const inputId = useId().replace(/:/g, '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<ImportPhase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [draft, setDraft] = useState<TrainingSchedule | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('replace')

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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleFilePick = (picked: File | null) => {
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
    setError(null)
    setDraft(null)
    setWarnings([])
    setPhase('ready')
  }

  const handleParse = async () => {
    if (!file) return
    setPhase('parsing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/manage/gym/${gymId}/parse-schedule`, {
        method: 'POST',
        body: formData,
      })

      const data = (await res.json()) as {
        error?: string
        schedule?: TrainingSchedule
        warnings?: string[]
      }

      if (!res.ok) {
        throw new Error(data.error || 'Could not parse timetable.')
      }

      if (!data.schedule) {
        throw new Error('No schedule returned.')
      }

      setDraft(data.schedule)
      setWarnings(data.warnings ?? [])
      setApplyMode(existingCount > 0 ? 'merge' : 'replace')
      setPhase('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse timetable.')
      setPhase('error')
    }
  }

  const updateSession = (
    day: TrainingScheduleDay,
    index: number,
    patch: Partial<TrainingScheduleSession>,
  ) => {
    if (!draft) return
    const next = { ...draft, [day]: [...draft[day]] }
    next[day][index] = { ...next[day][index], ...patch }
    setDraft(next)
  }

  const removeSession = (day: TrainingScheduleDay, index: number) => {
    if (!draft) return
    const next = { ...draft, [day]: draft[day].filter((_, i) => i !== index) }
    setDraft(next)
  }

  const addSession = (day: TrainingScheduleDay) => {
    if (!draft) return
    setDraft({ ...draft, [day]: [...draft[day], { time: '', type: '' }] })
  }

  const handleApply = () => {
    if (!draft) return
    const cleaned = { ...draft }
    for (const day of TRAINING_SCHEDULE_DAYS) {
      cleaned[day] = draft[day].filter((s) => s.time.trim())
    }
    if (countTrainingScheduleSessions(cleaned) === 0) {
      setError('Add at least one session with a time before applying.')
      setPhase('error')
      return
    }

    const base = TRAINING_SCHEDULE_DAYS.reduce((acc, day) => {
      acc[day] = [...(currentSchedule[day] ?? [])]
      return acc
    }, {} as TrainingSchedule)

    const finalSchedule =
      applyMode === 'merge' ? mergeTrainingSchedules(base, cleaned) : cleaned

    onApply(finalSchedule, applyMode)
    reset()
  }

  return (
    <div className={sectionCard}>
      <div className="border-b border-[#003580]/10 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#003580]/10 text-[#003580]">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            {collapsible ? (
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => setExpanded((e) => !e)}
              >
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-gray-900">
                    Optional: auto-fill from photo (AI)
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Have a timetable image but want the interactive schedule? Upload it here and
                    we&apos;ll draft the times for you to review — uses a small API call per parse.
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-[#003580]">
                  {expanded ? 'Hide' : 'Show'}
                </span>
              </button>
            ) : (
              <>
                <h3 className="text-base font-semibold tracking-tight text-gray-900">
                  Import from timetable photo
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Upload a weekly schedule (screenshot, poster, or Instagram story). We&apos;ll read
                  the class times and pre-fill the grid below — you confirm before anything is saved.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {(!collapsible || expanded) ? (
      <div className="space-y-4 px-5 py-5 md:px-6 md:py-6">
        {phase === 'review' && draft ? (
          <>
            {warnings.length > 0 ? (
              <div className="rounded-lg border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                <p className="flex items-start gap-2 font-medium">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Please double-check these items
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
                <span className="font-semibold text-[#003580]">{draftCount}</span> session
                {draftCount === 1 ? '' : 's'} parsed — edit anything that looks off.
              </p>
              {existingCount > 0 ? (
                <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      applyMode === 'merge'
                        ? 'bg-white text-[#003580] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900',
                    )}
                    onClick={() => setApplyMode('merge')}
                  >
                    Merge with existing
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      applyMode === 'replace'
                        ? 'bg-white text-[#003580] shadow-sm'
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
                    className="rounded-lg border border-gray-200/90 bg-white/90 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                      <p className="text-sm font-semibold text-gray-900">{DAY_LABELS[day]}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-[#003580]"
                        onClick={() => addSession(day)}
                      >
                        + Add
                      </Button>
                    </div>
                    <div className="space-y-2 p-3">
                      {sessions.map((session, index) => (
                        <div
                          key={`${day}-${index}`}
                          className="grid grid-cols-1 gap-2 rounded-md border border-gray-100 bg-gray-50/60 p-2.5 sm:grid-cols-[1fr_1fr_auto]"
                        >
                          <div className="space-y-1">
                            <Label className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                              Time
                            </Label>
                            <Input
                              value={session.time}
                              onChange={(e) => updateSession(day, index, { time: e.target.value })}
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
                              onChange={(e) => updateSession(day, index, { type: e.target.value })}
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
                              onClick={() => removeSession(day, index)}
                              aria-label="Remove session"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className={btnGhost} onClick={reset}>
                Discard
              </Button>
              <Button type="button" className={cn(btnPrimary, 'shadow-sm')} onClick={handleApply}>
                <Check className="mr-2 h-4 w-4" />
                Use this schedule
              </Button>
            </div>
          </>
        ) : (
          <>
            {previewUrl ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative mx-auto w-full max-w-[200px] shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm sm:mx-0">
                  <img
                    src={previewUrl}
                    alt="Timetable preview"
                    className="max-h-48 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={reset}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="truncate text-sm font-medium text-gray-900">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll extract class times and names. Nothing is saved until you confirm and
                    save your gym profile.
                  </p>
                  {phase === 'parsing' ? (
                    <div className="flex items-center gap-2 text-sm text-[#003580]">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Reading timetable…
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className={cn(btnPrimary, 'shadow-sm')}
                      onClick={() => void handleParse()}
                      disabled={!file}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Parse timetable
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  id={inputId}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor={inputId}
                  className="flex cursor-pointer flex-col items-center gap-2"
                >
                  <Upload className="h-9 w-9 text-[#003580]/45" aria-hidden />
                  <span className="text-sm font-semibold text-gray-900">Choose timetable image</span>
                  <span className="max-w-sm text-xs text-muted-foreground">
                    PNG, JPEG, or WebP · weekly grid, poster, or screenshot · max 10 MB
                  </span>
                </label>
              </div>
            )}

            {(phase === 'error' || error) && error ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>{error}</p>
              </div>
            ) : null}

            {!previewUrl && existingCount === 0 ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                No sessions yet — import a photo or add times manually below.
              </p>
            ) : null}
          </>
        )}
      </div>
      ) : null}
    </div>
  )
}
