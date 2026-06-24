'use client'

import { useState } from 'react'
import type { BusynessSource, DayOfWeek, PopularTimes } from '@/lib/gym/busyness-types'
import { DAYS_OF_WEEK } from '@/lib/gym/busyness-types'

interface PopularTimesChartProps {
  data: PopularTimes
  source?: BusynessSource
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

function barColor(percentage: number): string {
  if (percentage >= 80) return 'bg-[#003580]'
  if (percentage >= 50) return 'bg-[#0057b8]'
  if (percentage >= 25) return 'bg-[#febb02]/70'
  return 'bg-gray-200'
}

const SOURCE_LABELS: Record<BusynessSource, string> = {
  google: 'Based on Google Popular Times',
  nearby_clone: 'Estimated from nearby gyms in this area',
  template: 'Standard training camp schedule',
  unknown: 'Estimated busyness',
}

/** Fixed pixel height — % heights break inside nested flex columns. */
const BAR_AREA_PX = 128

export function PopularTimesChart({ data, source = 'unknown' }: PopularTimesChartProps) {
  const today = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const [activeDay, setActiveDay] = useState<DayOfWeek>(today)

  const dayData = data.find((d) => d.day === activeDay) ?? data[0]
  const hours = dayData?.hours ?? []

  const maxHour = hours.length > 0 ? Math.max(...hours.map((h) => h.hour)) : 22
  const minHour = hours.length > 0 ? Math.min(...hours.map((h) => h.hour)) : 6
  const displayHours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i)
  const hourMap = new Map(hours.map((h) => [h.hour, h.percentage]))

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-sm md:text-lg text-gray-900">Popular Times</h3>
          <p className="mt-0.5 text-xs md:text-sm text-gray-500">{SOURCE_LABELS[source]}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                day === activeDay
                  ? 'bg-[#003580] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-1.5">
        {displayHours.map((hour) => {
          const percentage = hourMap.get(hour) ?? 0
          const barHeightPx = Math.max(3, Math.round((percentage / 100) * BAR_AREA_PX))

          return (
            <div key={hour} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="relative flex w-full items-end"
                style={{ height: BAR_AREA_PX }}
              >
                <div
                  className={`w-full rounded-t transition-all ${barColor(percentage)}`}
                  style={{ height: barHeightPx }}
                  title={`${formatHour(hour)}: ${percentage}% busy`}
                />
                <span className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {percentage}%
                </span>
              </div>
              <span className="text-[10px] text-gray-400">
                {hour % 3 === 0 ? formatHour(hour).replace(' ', '') : ''}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <LegendItem color="bg-gray-200" label="Quiet" />
        <LegendItem color="bg-[#febb02]/70" label="Moderate" />
        <LegendItem color="bg-[#0057b8]" label="Busy" />
        <LegendItem color="bg-[#003580]" label="Peak" />
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
