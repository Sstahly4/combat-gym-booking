'use client'

import type { Dispatch, SetStateAction } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GymSchedulePreview } from '@/components/manage/gym-schedule-preview'
import { TrainingScheduleImportPanel } from '@/components/manage/training-schedule-import-panel'
import { TRAINING_SCHEDULE_DAYS, type TrainingSchedule } from '@/lib/manage/training-schedule'

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

type TrainingSession = { time: string; type?: string }
type TrainingScheduleState = Record<string, TrainingSession[]>

export function GymScheduleEditor({
  gymId,
  isAdmin,
  openingHours,
  onOpeningHoursChange,
  trainingSchedule,
  onTrainingScheduleChange,
  trainingScheduleExpanded,
  onTrainingScheduleExpandedChange,
  expandedDays,
  onExpandedDaysChange,
}: {
  gymId: string
  isAdmin: boolean
  openingHours: Record<string, string>
  onOpeningHoursChange: (hours: Record<string, string>) => void
  trainingSchedule: TrainingScheduleState
  onTrainingScheduleChange: Dispatch<SetStateAction<TrainingScheduleState>>
  trainingScheduleExpanded: boolean
  onTrainingScheduleExpandedChange: (expanded: boolean) => void
  expandedDays: Record<string, boolean>
  onExpandedDaysChange: Dispatch<SetStateAction<Record<string, boolean>>>
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-14">
      <div className="flex min-h-0 flex-col gap-8 lg:max-h-[min(72vh,calc(100dvh-11rem))] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Opening hours</h2>
            <p className="mt-1 text-sm text-gray-500">
              When your gym is open to the public. Leave a day blank if it doesn&apos;t apply.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRAINING_SCHEDULE_DAYS.map((day) => (
              <div key={day} className="space-y-1.5">
                <Label htmlFor={`hours-${day}`} className="capitalize text-sm font-medium text-gray-700">
                  {DAY_LABELS[day] ?? day}
                </Label>
                <Input
                  id={`hours-${day}`}
                  value={openingHours[day] || ''}
                  onChange={(e) =>
                    onOpeningHoursChange({ ...openingHours, [day]: e.target.value })
                  }
                  placeholder="e.g. 07:00–20:00 or Closed"
                />
              </div>
            ))}
          </div>
        </section>

        <div className="lg:hidden">
          <GymSchedulePreview openingHours={openingHours} trainingSchedule={trainingSchedule} />
        </div>

        <section className="space-y-5 border-t border-gray-100 pt-8">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Import from photo</h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload a timetable photo — we&apos;ll read the sessions for you to review.
            </p>
          </div>
          <TrainingScheduleImportPanel
            gymId={gymId}
            currentSchedule={trainingSchedule}
            isAdmin={isAdmin}
            onApply={(schedule: TrainingSchedule) => {
              onTrainingScheduleChange(schedule)
              onTrainingScheduleExpandedChange(true)
              onExpandedDaysChange((prev) => {
                const next = { ...prev }
                for (const day of TRAINING_SCHEDULE_DAYS) {
                  if (schedule[day]?.some((session) => session.time.trim())) {
                    next[day] = true
                  }
                }
                return next
              })
            }}
          />
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-8">
          <button
            type="button"
            onClick={() => onTrainingScheduleExpandedChange(!trainingScheduleExpanded)}
            className="-m-2 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-gray-50"
          >
            <div>
              <h2 className="text-base font-semibold text-gray-900">Enter sessions by day</h2>
              <p className="mt-1 text-sm text-gray-500">
                Review imported times or add classes manually.
              </p>
            </div>
            {trainingScheduleExpanded ? (
              <ChevronUp className="ml-4 h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            ) : (
              <ChevronDown className="ml-4 h-5 w-5 shrink-0 text-gray-500" aria-hidden />
            )}
          </button>

          {trainingScheduleExpanded ? (
            <div className="space-y-3">
              {TRAINING_SCHEDULE_DAYS.map((day) => {
                const sessions = trainingSchedule[day] || []
                const isDayExpanded = expandedDays[day]
                const sessionCount = sessions.filter((session) => session.time.trim() !== '').length

                return (
                  <div
                    key={day}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.02]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onExpandedDaysChange({ ...expandedDays, [day]: !isDayExpanded })
                      }
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80"
                    >
                      <div className="flex items-center gap-3">
                        {isDayExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
                        )}
                        <span className="text-sm font-semibold text-gray-900">
                          {DAY_LABELS[day] ?? day}
                        </span>
                        {sessionCount > 0 ? (
                          <span className="text-xs text-gray-500">
                            ({sessionCount} {sessionCount === 1 ? 'session' : 'sessions'})
                          </span>
                        ) : null}
                      </div>
                      {!isDayExpanded && sessionCount === 0 ? (
                        <span className="text-xs italic text-gray-400">No sessions</span>
                      ) : null}
                    </button>

                    {isDayExpanded ? (
                      <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onTrainingScheduleChange({
                                ...trainingSchedule,
                                [day]: [...sessions, { time: '', type: '' }],
                              })
                            }}
                          >
                            Add session
                          </Button>
                        </div>

                        {sessions.length === 0 ? (
                          <p className="py-2 text-center text-sm italic text-gray-500">
                            No training sessions scheduled
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {sessions.map((session, sessionIndex) => (
                              <div
                                key={sessionIndex}
                                className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3"
                              >
                                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-gray-600">Time</Label>
                                    <Input
                                      value={session.time}
                                      onChange={(e) => {
                                        const updated = [...sessions]
                                        updated[sessionIndex] = { ...session, time: e.target.value }
                                        onTrainingScheduleChange({
                                          ...trainingSchedule,
                                          [day]: updated,
                                        })
                                      }}
                                      placeholder="e.g. 6:00–8:00"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-gray-600">Type (optional)</Label>
                                    <Input
                                      value={session.type || ''}
                                      onChange={(e) => {
                                        const updated = [...sessions]
                                        updated[sessionIndex] = { ...session, type: e.target.value }
                                        onTrainingScheduleChange({
                                          ...trainingSchedule,
                                          [day]: updated,
                                        })
                                      }}
                                      placeholder="e.g. Morning, Sparring"
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = sessions.filter((_, index) => index !== sessionIndex)
                                    onTrainingScheduleChange({
                                      ...trainingSchedule,
                                      [day]: updated,
                                    })
                                  }}
                                  className="mt-6 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}
        </section>
      </div>

      <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <GymSchedulePreview openingHours={openingHours} trainingSchedule={trainingSchedule} />
      </div>
    </div>
  )
}
