'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import type { BusynessSource, DayOfWeek, PopularTimes } from '@/lib/gym/busyness-types'
import { DAY_ABBREVIATIONS, DAYS_OF_WEEK } from '@/lib/gym/busyness-types'
import {
  CHART_GRID_FRACTIONS,
  HISTORICAL_BAR_COLOR,
  LIVE_HISTORICAL_GHOST_OPACITY,
  axisTicksForWindow,
  buildDynamicHourWindow,
  defaultSelectedHour,
  findDayBusyness,
  formatAxisHour,
  getGymLocalDateTime,
  historicalStatusLabel,
  isLiveAlert,
  liveForegroundColor,
  liveStatusLabel,
  percentageToBarHeight,
  resolveChartTimezone,
  resolveLivePercentage,
  todaySelectedHour,
} from '@/lib/gym/busyness-utils'
import { MatCapacityInfoPopover } from '@/components/gym/mat-capacity-info-popover'

interface PopularTimesChartProps {
  data: PopularTimes
  source?: BusynessSource
  timezone?: string | null
  liveByHour?: Record<number, number> | null
}

const CHART_HEIGHT_PX = 96
const HISTORICAL_BAR_W_PX = 11
const LIVE_GHOST_W_PX = 22
const LIVE_FOREGROUND_W_PX = 8

function useGymLocalClock(timezone?: string | null) {
  const tz = resolveChartTimezone(timezone)
  const [gymNow, setGymNow] = useState(() => getGymLocalDateTime(tz))

  useEffect(() => {
    setGymNow(getGymLocalDateTime(tz))
    const id = window.setInterval(() => setGymNow(getGymLocalDateTime(tz)), 60_000)
    return () => window.clearInterval(id)
  }, [tz])

  return gymNow
}

export function PopularTimesChart({
  data,
  source = 'unknown',
  timezone,
  liveByHour,
}: PopularTimesChartProps) {
  const gymNow = useGymLocalClock(timezone)
  const userAdjusted = useRef(false)

  const initialDayData = findDayBusyness(data, gymNow.day) ?? data[0]
  const initialDisplay = buildDynamicHourWindow(initialDayData?.hours ?? [])

  const [activeDay, setActiveDay] = useState<DayOfWeek>(gymNow.day)
  const [selectedHour, setSelectedHour] = useState<number>(() =>
    todaySelectedHour(initialDisplay.displayHours, gymNow.hour),
  )
  const [infoOpen, setInfoOpen] = useState(false)

  const dayData = findDayBusyness(data, activeDay) ?? data[0]
  const hours = dayData?.hours ?? []
  const { minHour, maxHour, displayHours, hourMap } = useMemo(
    () => buildDynamicHourWindow(hours),
    [hours],
  )

  useEffect(() => {
    if (userAdjusted.current) return
    const todayData = findDayBusyness(data, gymNow.day)
    const todayDisplay = buildDynamicHourWindow(todayData?.hours ?? [])
    setActiveDay(gymNow.day)
    setSelectedHour(todaySelectedHour(todayDisplay.displayHours, gymNow.hour))
  }, [gymNow.day, gymNow.hour, data])

  const handleDayChange = useCallback(
    (day: DayOfWeek) => {
      userAdjusted.current = true
      const nextDayData = findDayBusyness(data, day)
      const nextDisplay = buildDynamicHourWindow(nextDayData?.hours ?? [])
      setActiveDay(day)
      if (day === gymNow.day) {
        setSelectedHour(todaySelectedHour(nextDisplay.displayHours, gymNow.hour))
      } else {
        setSelectedHour(defaultSelectedHour(nextDisplay.displayHours))
      }
    },
    [data, gymNow.day, gymNow.hour],
  )

  const handleHourSelect = useCallback((hour: number) => {
    userAdjusted.current = true
    setSelectedHour(hour)
  }, [])

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
  const selectedHistorical = hourMap.get(selectedHour) ?? 0
  const selectedLive = resolveLivePercentage(selectedHour, selectedHistorical, liveByHour)
  const isLiveSelection = isToday && selectedHour === liveHour
  const liveAlert = isLiveAlert(selectedLive, selectedHistorical)
  const ticks = axisTicksForWindow(minHour, maxHour)

  const barCenter = (hour: number) => {
    const idx = displayHours.indexOf(hour)
    if (idx < 0) return null
    return displayHours.length > 1
      ? `${((idx + 0.5) / displayHours.length) * 100}%`
      : '50%'
  }

  const indicatorLineLeft = barCenter(selectedHour) ?? '50%'

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
          const isGymToday = day === gymNow.day
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayChange(day)}
              className={`min-w-0 flex-1 pb-2.5 text-[10px] font-medium tracking-wide transition-colors sm:text-[11px] ${
                isActive
                  ? 'border-b-2 border-[#1a73e8] text-gray-900'
                  : isGymToday
                    ? 'text-gray-600 hover:text-gray-800'
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

      <div className="relative mb-1 min-h-[20px]">
        {isLiveSelection ? (
          <div
            className="absolute top-0 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[13px]"
            style={{ left: indicatorLineLeft }}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${
                  liveAlert ? 'bg-red-400' : 'bg-blue-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  liveAlert ? 'bg-red-500' : 'bg-[#003580]'
                }`}
              />
            </span>
            <span>
              <span
                className={`font-semibold ${
                  liveAlert ? 'text-red-600' : 'text-[#003580]'
                }`}
              >
                Live:
              </span>{' '}
              <span className="text-gray-800">
                {liveStatusLabel(selectedLive, selectedHistorical)}
              </span>
            </span>
          </div>
        ) : (
          <p className="text-[13px] text-gray-800">
            {historicalStatusLabel(selectedHistorical)}
          </p>
        )}
      </div>

      <div className="relative pt-1">
        <div
          className="pointer-events-none absolute top-0 bottom-5 z-20 w-px border-l border-dotted border-gray-400 transition-[left] duration-200 ease-out"
          style={{ left: indicatorLineLeft }}
          aria-hidden
        />

        <div
          className="relative border-b border-gray-300"
          style={{ height: CHART_HEIGHT_PX }}
        >
          {CHART_GRID_FRACTIONS.map((frac) => (
            <div
              key={frac}
              className="pointer-events-none absolute left-0 right-0 border-t border-gray-200/90"
              style={{ bottom: `${frac * CHART_HEIGHT_PX}px` }}
              aria-hidden
            />
          ))}

          <div
            className="absolute inset-x-0 bottom-0 flex items-end gap-[3px]"
            style={{ height: CHART_HEIGHT_PX }}
          >
            {displayHours.map((hour) => {
              const historicalPct = hourMap.get(hour) ?? 0
              const livePct = resolveLivePercentage(hour, historicalPct, liveByHour)
              const isLiveColumn = isToday && hour === liveHour
              const histHeightPx = percentageToBarHeight(historicalPct, CHART_HEIGHT_PX)
              const liveHeightPx = percentageToBarHeight(livePct, CHART_HEIGHT_PX)

              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => handleHourSelect(hour)}
                  className="group relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end border-0 bg-transparent p-0"
                  style={{ height: CHART_HEIGHT_PX }}
                  aria-label={
                    isLiveColumn
                      ? `Live ${formatAxisHour(hour)}: ${liveStatusLabel(livePct, historicalPct)}`
                      : `${formatAxisHour(hour)}: ${historicalStatusLabel(historicalPct)}`
                  }
                  aria-pressed={hour === selectedHour}
                >
                  {isLiveColumn ? (
                    <div className="relative flex h-full w-full items-end justify-center">
                      <div
                        className="absolute bottom-0 rounded-full"
                        style={{
                          width: LIVE_GHOST_W_PX,
                          height: histHeightPx,
                          backgroundColor: HISTORICAL_BAR_COLOR,
                          opacity: LIVE_HISTORICAL_GHOST_OPACITY,
                        }}
                        aria-hidden
                      />
                      <div
                        className="relative z-10 rounded-full transition-all duration-200"
                        style={{
                          width: LIVE_FOREGROUND_W_PX,
                          height: liveHeightPx,
                          backgroundColor: liveForegroundColor(livePct, historicalPct),
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="shrink-0 rounded-full transition-all duration-200"
                      style={{
                        width: HISTORICAL_BAR_W_PX,
                        height: histHeightPx,
                        backgroundColor: HISTORICAL_BAR_COLOR,
                      }}
                    />
                  )}
                  <span className="pointer-events-none absolute -top-7 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-0.5 text-[10px] text-white shadow-sm group-hover:block">
                    {formatAxisHour(hour)} · {isLiveColumn ? livePct : historicalPct}%
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
