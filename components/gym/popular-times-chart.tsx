'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import type { BusynessSource, DayOfWeek, PopularTimes } from '@/lib/gym/busyness-types'
import { DAY_ABBREVIATIONS, DAYS_OF_WEEK } from '@/lib/gym/busyness-types'
import {
  barFillColor,
  busynessStatusLabel,
  defaultSelectedHour,
  formatAxisHour,
  getGymLocalDateTime,
  googleAxisTicks,
  isLiveBarHighlighted,
  todaySelectedHour,
} from '@/lib/gym/busyness-utils'
import { MatCapacityInfoPopover } from '@/components/gym/mat-capacity-info-popover'

interface PopularTimesChartProps {
  data: PopularTimes
  source?: BusynessSource
  timezone?: string | null
}

const CHART_HEIGHT_PX = 80

function buildDisplayHours(hours: { hour: number; percentage: number }[]) {
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
}

export function PopularTimesChart({
  data,
  source = 'unknown',
  timezone,
}: PopularTimesChartProps) {
  const gymNow = useMemo(() => getGymLocalDateTime(timezone), [timezone])

  const initialDayData = data.find((d) => d.day === gymNow.day) ?? data[0]
  const initialHours = initialDayData?.hours ?? []
  const initialDisplay = buildDisplayHours(initialHours)

  const [activeDay, setActiveDay] = useState<DayOfWeek>(gymNow.day)
  const [selectedHour, setSelectedHour] = useState<number>(() =>
    todaySelectedHour(initialDisplay.displayHours, gymNow.hour),
  )
  const [infoOpen, setInfoOpen] = useState(false)

  const dayData = data.find((d) => d.day === activeDay) ?? data[0]
  const hours = dayData?.hours ?? []
  const { minHour, maxHour, displayHours, hourMap } = useMemo(
    () => buildDisplayHours(hours),
    [hours],
  )

  const handleDayChange = useCallback(
    (day: DayOfWeek) => {
      const nextDayData = data.find((d) => d.day === day)
      const nextDisplay = buildDisplayHours(nextDayData?.hours ?? [])
      setActiveDay(day)
      if (day === gymNow.day) {
        setSelectedHour(todaySelectedHour(nextDisplay.displayHours, gymNow.hour))
      } else {
        setSelectedHour(defaultSelectedHour(nextDisplay.displayHours))
      }
    },
    [data, gymNow.day, gymNow.hour],
  )

  useEffect(() => {
    if (displayHours.includes(selectedHour)) return
    if (activeDay === gymNow.day) {
      setSelectedHour(todaySelectedHour(displayHours, gymNow.hour))
    } else {
      setSelectedHour(defaultSelectedHour(displayHours))
    }
  }, [displayHours, selectedHour, activeDay, gymNow.day, gymNow.hour])

  const isToday = activeDay === gymNow.day
  const liveHour = gymNow.hour
  const selectedPercentage = hourMap.get(selectedHour) ?? 0
  const isLiveSelection = isToday && selectedHour === liveHour
  const liveHighlighted = isLiveBarHighlighted(selectedPercentage)
  const ticks = googleAxisTicks(minHour, maxHour)

  const barCenter = (hour: number) => {
    const idx = displayHours.indexOf(hour)
    if (idx < 0) return null
    return displayHours.length > 1
      ? `${((idx + 0.5) / displayHours.length) * 100}%`
      : '50%'
  }

  const selectedLineLeft = barCenter(selectedHour) ?? '50%'

  return (
    <div className="select-none">
      <div className="relative mb-4 flex items-center gap-1.5">
        <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">
          Mat Capacity
        </h3>
        <button
          type="button"
          onClick={() => setInfoOpen((v) => !v)}
          className="text-gray-400 transition-colors hover:text-gray-600"
          aria-label="About mat capacity"
          aria-expanded={infoOpen}
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <MatCapacityInfoPopover
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          source={source}
        />
      </div>

      <div className="mb-4 flex justify-between border-b border-gray-100">
        {DAYS_OF_WEEK.map((day, i) => {
          const isActive = day === activeDay
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayChange(day)}
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

      <div className="relative mb-2 flex items-center gap-2 text-[13px]">
        {isLiveSelection ? (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${
                  liveHighlighted ? 'bg-red-400' : 'bg-blue-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  liveHighlighted ? 'bg-red-500' : 'bg-[#8ab4f8]'
                }`}
              />
            </span>
            <span>
              <span
                className={`font-semibold ${
                  liveHighlighted ? 'text-red-600' : 'text-[#1a73e8]'
                }`}
              >
                Live:
              </span>{' '}
              <span className="text-gray-800">
                {busynessStatusLabel(selectedPercentage)}
              </span>
            </span>
          </>
        ) : (
          <span className="text-gray-800">
            <span className="font-medium">{formatAxisHour(selectedHour)}</span>
            {' · '}
            {busynessStatusLabel(selectedPercentage)}
          </span>
        )}
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute -top-1 bottom-5 z-20 w-px border-l border-dotted border-gray-400 transition-[left] duration-200 ease-out"
          style={{ left: selectedLineLeft }}
          aria-hidden
        />

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
              const isLiveHour = isToday && hour === liveHour
              const isSelected = hour === selectedHour

              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => setSelectedHour(hour)}
                  className="group relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end border-0 bg-transparent p-0"
                  style={{ height: CHART_HEIGHT_PX }}
                  aria-label={`${formatAxisHour(hour)}: ${busynessStatusLabel(percentage)}`}
                  aria-pressed={isSelected}
                >
                  <div
                    className={`w-full max-w-[12px] shrink-0 rounded-full transition-all duration-200 sm:max-w-[14px] ${
                      isSelected ? 'ring-2 ring-gray-400/60 ring-offset-1' : ''
                    }`}
                    style={{
                      height: barHeightPx,
                      backgroundColor: barFillColor(percentage, isLiveHour),
                    }}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-0.5 text-[10px] text-white shadow-sm group-hover:block">
                    {formatAxisHour(hour)} · {percentage}%
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative mt-2 h-5">
          {ticks.map((tick) => {
            const left = barCenter(tick)
            if (!left) return null
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
