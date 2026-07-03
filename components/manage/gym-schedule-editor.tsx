'use client'

import type { Dispatch, SetStateAction } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GymEditPanel, GymEditSection } from '@/components/manage/gym-edit-section'
import { GymSchedulePreview } from '@/components/manage/gym-schedule-preview'
import { TrainingScheduleImportPanel } from '@/components/manage/training-schedule-import-panel'
import { TRAINING_SCHEDULE_DAYS, type TrainingSchedule } from '@/lib/manage/training-schedule'
import { cn } from '@/lib/utils'

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

function DaySessionsEditor({
  day,
  sessions,
  isExpanded,
  onToggleDay,
  onChange,
}: {
  day: string
  sessions: TrainingSession[]
  isExpanded: boolean
  onToggleDay: () => void
  onChange: (sessions: TrainingSession[]) => void
}) {
  const sessionCount = sessions.filter((session) => session.time.trim() !== '').length

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-black/[0.04]">
      <button
        type="button"
        onClick={onToggleDay}
        className="flex w-full items-center justify-between bg-gray-50/80 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
          )}
          <span className="text-sm font-semibold text-gray-900">{DAY_LABELS[day] ?? day}</span>
          {sessionCount > 0 ? (
            <span className="text-xs text-gray-500">
              ({sessionCount} {sessionCount === 1 ? 'session' : 'sessions'})
            </span>
          ) : null}
        </div>
        {!isExpanded && sessionCount === 0 ? (
          <span className="text-xs italic text-gray-400">No sessions</span>
        ) : null}
      </button>

      {isExpanded ? (
        <div className="space-y-3 border-t border-gray-100 bg-white px-4 pb-4 pt-3">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange([...sessions, { time: '', type: '' }])}
            >
              Add session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <p className="py-2 text-center text-sm text-gray-500">No classes scheduled yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((session, sessionIndex) => (
                <div key={sessionIndex} className="space-y-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">Session {sessionIndex + 1}</p>
                    <button
                      type="button"
                      onClick={() => onChange(sessions.filter((_, index) => index !== sessionIndex))}
                      className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900">Time</Label>
                      <Input
                        value={session.time}
                        onChange={(e) => {
                          const updated = [...sessions]
                          updated[sessionIndex] = { ...session, time: e.target.value }
                          onChange(updated)
                        }}
                        placeholder="e.g. 6:00–8:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900">Type (optional)</Label>
                      <Input
                        value={session.type || ''}
                        onChange={(e) => {
                          const updated = [...sessions]
                          updated[sessionIndex] = { ...session, type: e.target.value }
                          onChange(updated)
                        }}
                        placeholder="e.g. Morning, Sparring"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export function GymScheduleEditor({
  gymId,
  isAdmin,
  openingHours,
  onOpeningHoursChange,
  trainingSchedule,
  onTrainingScheduleChange,
  expandedDays,
  onExpandedDaysChange,
}: {
  gymId: string
  isAdmin: boolean
  openingHours: Record<string, string>
  onOpeningHoursChange: (hours: Record<string, string>) => void
  trainingSchedule: TrainingScheduleState
  onTrainingScheduleChange: Dispatch<SetStateAction<TrainingScheduleState>>
  expandedDays: Record<string, boolean>
  onExpandedDaysChange: Dispatch<SetStateAction<Record<string, boolean>>>
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(22rem,34%)] lg:items-start xl:gap-8">
      <GymEditPanel>
        <GymEditSection
          title="Class schedule"
          description="Add training sessions by day — guests see these on your public listing."
        >
          <div className="space-y-3">
            {TRAINING_SCHEDULE_DAYS.map((day) => (
              <DaySessionsEditor
                key={day}
                day={day}
                sessions={trainingSchedule[day] || []}
                isExpanded={Boolean(expandedDays[day])}
                onToggleDay={() =>
                  onExpandedDaysChange({ ...expandedDays, [day]: !expandedDays[day] })
                }
                onChange={(sessions) =>
                  onTrainingScheduleChange({ ...trainingSchedule, [day]: sessions })
                }
              />
            ))}
          </div>
        </GymEditSection>

        <GymEditSection
          title="Opening hours"
          description="When your gym is open to the public. Leave a day blank if it doesn't apply."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {TRAINING_SCHEDULE_DAYS.map((day) => (
              <div key={day} className="space-y-2">
                <Label htmlFor={`hours-${day}`} className="text-sm font-medium text-gray-900">
                  {DAY_LABELS[day] ?? day}
                </Label>
                <Input
                  id={`hours-${day}`}
                  value={openingHours[day] || ''}
                  onChange={(e) => onOpeningHoursChange({ ...openingHours, [day]: e.target.value })}
                  placeholder="e.g. 07:00–20:00 or Closed"
                />
              </div>
            ))}
          </div>
        </GymEditSection>

        <GymEditSection
          title="Import from photo"
          description="Upload a timetable photo — we'll read the sessions for you to review."
        >
          <TrainingScheduleImportPanel
            gymId={gymId}
            currentSchedule={trainingSchedule}
            isAdmin={isAdmin}
            onApply={(schedule: TrainingSchedule) => {
              onTrainingScheduleChange(schedule)
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
        </GymEditSection>
      </GymEditPanel>

      <aside className={cn('lg:sticky lg:top-6 lg:self-start')}>
        <GymSchedulePreview openingHours={openingHours} trainingSchedule={trainingSchedule} />
      </aside>
    </div>
  )
}
