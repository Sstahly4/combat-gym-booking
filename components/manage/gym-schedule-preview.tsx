'use client'

import { Clock, CalendarDays } from 'lucide-react'
import { TRAINING_SCHEDULE_DAYS } from '@/lib/manage/training-schedule'
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

export function GymSchedulePreview({
  openingHours,
  trainingSchedule,
  className,
}: {
  openingHours: Record<string, string>
  trainingSchedule: Record<string, Array<{ time: string; type?: string }>>
  className?: string
}) {
  const hoursEntries = TRAINING_SCHEDULE_DAYS.map((day) => ({
    day,
    hours: openingHours[day]?.trim() ?? '',
  })).filter((entry) => entry.hours.length > 0)

  const sessionDays = TRAINING_SCHEDULE_DAYS.map((day) => ({
    day,
    sessions: (trainingSchedule[day] ?? []).filter((session) => session.time.trim().length > 0),
  })).filter((entry) => entry.sessions.length > 0)

  const hasHours = hoursEntries.length > 0
  const hasSessions = sessionDays.length > 0
  const isEmpty = !hasHours && !hasSessions

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.03]',
        className,
      )}
    >
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">Guest preview</h2>
        <p className="mt-1 text-sm text-gray-500">Opening hours and classes on your public listing.</p>
      </div>

      <div className="space-y-5 p-5">
        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center">
            <p className="text-sm text-gray-500">Hours and classes will appear here as you add them.</p>
          </div>
        ) : null}

        {hasHours ? (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" aria-hidden />
              <h3 className="text-sm font-semibold text-gray-900">Opening hours</h3>
            </div>
            <div className="divide-y divide-dashed divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50">
              {hoursEntries.map(({ day, hours }) => (
                <div key={day} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="font-medium capitalize text-gray-700">{DAY_LABELS[day] ?? day}</span>
                  <span className="text-gray-500">{hours}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {hasSessions ? (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" aria-hidden />
              <h3 className="text-sm font-semibold text-gray-900">Class schedule</h3>
            </div>
            <div className="space-y-3">
              {sessionDays.map(({ day, sessions }) => (
                <div
                  key={day}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50"
                >
                  <div className="border-b border-gray-100 bg-white px-4 py-2.5">
                    <p className="text-sm font-semibold text-gray-900">{DAY_LABELS[day] ?? day}</p>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {sessions.map((session, index) => (
                      <li
                        key={`${day}-${index}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                      >
                        <span className="font-medium text-gray-800">{session.time}</span>
                        {session.type?.trim() ? (
                          <span className="rounded-full bg-[#003580]/10 px-2.5 py-0.5 text-xs font-medium text-[#003580]">
                            {session.type}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Session</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
