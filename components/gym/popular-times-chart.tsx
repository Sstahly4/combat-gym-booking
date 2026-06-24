'use client'

import { useMemo, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import type { BusynessSource, DayOfWeek, PopularTimes } from '@/lib/gym/busyness-types'
import { DAY_ABBREVIATIONS, DAYS_OF_WEEK } from '@/lib/gym/busyness-types'
import {
  axisTickHours,
  busynessStatusLabel,
  formatAxisHour,
  getGymLocalDateTime,
} from '@/lib/gym/busyness-utils'

interface PopularTimesChartProps {
  data: PopularTimes
  source?: BusynessSource
  timezone?: string | null
}

const CHART_HEIGHT_PX = 72
const BAR_COLOR = '#8ab4f8'
const LIVE_BAR_COLOR = '#e87171'

const SOURCE_TOOLTIPS: Record<BusynessSource, string> = {
  google: 'Typical busyness by hour, based on Google Popular Times.',
  nearby_clone: 'Estimated from nearby gyms in this area.',
  template: 'Standard training camp busyness curve.',
  unknown: 'Estimated typical busyness by hour.',
}

export function PopularTimesChart({
  data,
  source = 'unknown',
  timezone,
}: PopularTimesChartProps) {
  const gymNow = useMemo(() => getGymLocalDateTime(timezone), [timezone])
  const [activeDay, setActiveDay] = useState<DayOfWeek>(gymNow.day)

  const dayData = data.find((d) => d.day === activeDay) ?? data[0]
  const hours = dayData?.hours ?? []

  const { minHour, maxHour, displayHours, hourMap } = useMemo(() => {
    if (hours.length === 0) {
      return {
        minHour: 9,
        maxHour: 21,
        displayHours: Array.from({ length: 13 }, (_, i) => i + 9),
        hourMap: new Map<number, number>(),
      }
    }
    const min = Math.min(...hours.map((h) => h.hour))
    const max = Math.max(...hours.map((h) => h.hour))
    return {
      minHour: min,
      maxHour: max,
      displayHours: Array.from({ length: max - min + 1 }, (_, i) => min + i),
      hourMap: new Map(hours.map((h) => [h.hour, h.percentage])),
    }
  }, [hours])

  const isToday = activeDay === gymNow.day
  const liveHour = gymNow.hour
  const livePercentage = hourMap.get(liveHour) ?? 0
  const liveIndex = displayHours.indexOf(liveHour)
  const showLive = isToday && liveIndex >= 0
  const ticks = axisTickHours(minHour, maxHour)

  const liveLineLeft =
    displayHours.length > 1
      ? `${((liveIndex + 0.5) / displayHours.length) * 100}%`
      : '50%'

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center gap-1.5">
        <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
          Mat Capacity
        </h3>
        <button
          type="button"
          className="text-gray-400 transition-colors hover:text-gray-600"
          aria-label="About mat capacity"
          title={SOURCE_TOOLTIPS[source]}
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mb-4 flex justify-between border-b border-gray-100">
        {DAYS_OF_WEEK.map((day, i) => {
          const isActive = day === activeDay
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              className={`min-w-0 flex-1 pb-2.5 text-[10px] font-medium tracking-wide transition-colors sm:text-[11px] ${
                isActive
                  ? 'border-b-2 border-[#1a73e8] text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-pressed={isActive}
              aria-label={day}
            >
              {DAY_ABBREVIATIONS[i]}
            </button>
          )
        })}
      </div>

      {showLive && (
        <div className="relative mb-2 flex items-center gap-2 text-[13px]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span>
            <span className="font-semibold text-red-600">Live:</span>{' '}
            <span className="text-gray-800">{busynessStatusLabel(livePercentage)}</span>
          </span>
        </div>
      )}

      <div className="relative">
        {showLive && (
          <div
            className="pointer-events-none absolute -top-1 bottom-4 z-20 w-px border-l border-dotted border-gray-400"
            style={{ left: liveLineLeft }}
            aria-hidden
          />
        )}

        <div
          className="relative border-b border-gray-300"
          style={{ height: CHART_HEIGHT_PX }}
        >
          {[0.25, 0.5, 0.75].map((frac) => (
            <div
              key={frac}
              className="pointer-events-none absolute left-0 right-0 border-t border-gray-100"
              style={{ bottom: `${frac * CHART_HEIGHT_PX}px` }}
              aria-hidden
            />
          ))}

          <div
            className="absolute inset-x-0 bottom-0 flex items-end gap-[3px]"
            style={{ height: CHART_HEIGHT_PX }}
          >
            {displayHours.map((hour) => {
              const percentage = hourMap.get(hour) ?? 0
              const barHeightPx = Math.max(4, Math.round((percentage / 100) * CHART_HEIGHT_PX))
              const isLiveHour = showLive && hour === liveHour

              return (
                <div
                  key={hour}
                  className="group relative flex min-w-0 flex-1 justify-center"
                  style={{ height: CHART_HEIGHT_PX }}
                >
                  <div
                    className="w-full max-w-[12px] rounded-full transition-all duration-200 sm:max-w-[14px]"
                    style={{
                      height: barHeightPx,
                      backgroundColor: isLiveHour ? LIVE_BAR_COLOR : BAR_COLOR,
                    }}
                    title={`${formatAxisHour(hour)}: ${percentage}%`}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-0.5 text-[10px] text-white shadow-sm group-hover:block">
                    {formatAxisHour(hour)} · {percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative mt-2 h-4">
          {ticks.map((tick) => {
            const idx = displayHours.indexOf(tick)
            if (idx < 0) return null
            const left =
              displayHours.length > 1
                ? `${((idx + 0.5) / displayHours.length) * 100}%`
                : '50%'
            return (
              <span
                key={tick}
                className="absolute -translate-x-1/2 text-[11px] text-gray-500"
                style={{ left }}
              >
                {formatAxisHour(tick)}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
