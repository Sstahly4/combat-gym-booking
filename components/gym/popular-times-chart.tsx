'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { HelpCircle, Users } from 'lucide-react'
import type { BusynessSource, DayOfWeek, PopularTimes } from '@/lib/gym/busyness-types'
import { DAY_ABBREVIATIONS, DAYS_OF_WEEK } from '@/lib/gym/busyness-types'
import {
  CHART_GRID_FRACTIONS,
  HISTORICAL_BAR_COLOR,
  LABEL_ACCENT_COLOR,
  LIVE_HISTORICAL_GHOST_OPACITY,
  SELECTED_BAR_COLOR,
  axisTicksForWindow,
  buildDynamicHourWindow,
  barPercentageFloorForSource,
  defaultSelectedHour,
  findDayBusyness,
  formatAxisHour,
  getGymLocalDateTime,
  historicalSecondaryHint,
  historicalStatusLabel,
  isLiveAlert,
  liveForegroundColor,
  liveSecondaryHint,
  liveStatusLabel,
  percentageToBarHeight,
  resolveChartTimezone,
  resolveLivePercentage,
  barCenterPercent,
  floatingLabelPosition,
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
/** Horizontal inset so first/last bars and labels have breathing room (matches Google). */
const CHART_INSET_X = 'px-4 sm:px-5'

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
  const barPercentageFloor = barPercentageFloorForSource(source)
  const buildWindow = useCallback(
    (dayHours: { hour: number; percentage: number }[]) =>
      buildDynamicHourWindow(dayHours, { barPercentageFloor }),
    [barPercentageFloor],
  )

  const gymNow = useGymLocalClock(timezone)
  const userAdjusted = useRef(false)
  const plotRef = useRef<HTMLDivElement>(null)
  const barRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const [barLayout, setBarLayout] = useState<{
    centersByHour: Record<number, number>
    selectedPx: number
  }>({ centersByHour: {}, selectedPx: 0 })

  const initialDayData = findDayBusyness(data, gymNow.day) ?? data[0]
  const initialDisplay = buildWindow(initialDayData?.hours ?? [])

  const [activeDay, setActiveDay] = useState<DayOfWeek>(gymNow.day)
  const [selectedHour, setSelectedHour] = useState<number>(() =>
    todaySelectedHour(initialDisplay.barHours, gymNow.hour),
  )
  const [infoOpen, setInfoOpen] = useState(false)

  const dayData = findDayBusyness(data, activeDay) ?? data[0]
  const hours = dayData?.hours ?? []
  const { minHour, maxHour, barHours, displayHours, emptyHours, hourMap } = useMemo(
    () => buildWindow(hours),
    [hours, buildWindow],
  )

  useEffect(() => {
    if (userAdjusted.current) return
    const todayData = findDayBusyness(data, gymNow.day)
    const todayDisplay = buildWindow(todayData?.hours ?? [])
    setActiveDay(gymNow.day)
    setSelectedHour(todaySelectedHour(todayDisplay.barHours, gymNow.hour))
  }, [gymNow.day, gymNow.hour, data])

  const handleDayChange = useCallback(
    (day: DayOfWeek) => {
      userAdjusted.current = true
      const nextDayData = findDayBusyness(data, day)
      const nextDisplay = buildWindow(nextDayData?.hours ?? [])
      setActiveDay(day)
      if (day === gymNow.day) {
        setSelectedHour(todaySelectedHour(nextDisplay.barHours, gymNow.hour))
      } else {
        setSelectedHour(defaultSelectedHour(nextDisplay.barHours))
      }
    },
    [data, gymNow.day, gymNow.hour, buildWindow],
  )

  const handleHourSelect = useCallback((hour: number) => {
    userAdjusted.current = true
    setSelectedHour(hour)
  }, [])

  useEffect(() => {
    if (barHours.includes(selectedHour)) return
    if (activeDay === gymNow.day) {
      setSelectedHour(todaySelectedHour(barHours, gymNow.hour))
    } else {
      setSelectedHour(defaultSelectedHour(barHours))
    }
  }, [barHours, selectedHour, activeDay, gymNow.day, gymNow.hour])

  const isToday = activeDay === gymNow.day
  const liveHour = gymNow.hour
  const selectedHistorical = hourMap.get(selectedHour) ?? 0
  const selectedLive = resolveLivePercentage(selectedHour, selectedHistorical, liveByHour)
  const isLiveSelection = isToday && selectedHour === liveHour && barHours.includes(liveHour)
  const liveAlert = isLiveAlert(selectedLive, selectedHistorical)
  const ticks = axisTicksForWindow(minHour, maxHour)
  const dayPercentages = useMemo(
    () => barHours.map((hour) => hourMap.get(hour) ?? 0),
    [barHours, hourMap],
  )

  const measureBarLayout = useCallback(() => {
    const plot = plotRef.current
    if (!plot) return
    const plotRect = plot.getBoundingClientRect()
    if (plotRect.width <= 0) return

    const centersByHour: Record<number, number> = {}
    let selectedPx = plotRect.width / 2

    for (const hour of barHours) {
      const bar = barRefs.current.get(hour)
      if (!bar) continue
      const barRect = bar.getBoundingClientRect()
      const centerPx = barRect.left - plotRect.left + barRect.width / 2
      centersByHour[hour] = (centerPx / plotRect.width) * 100
      if (hour === selectedHour) selectedPx = centerPx
    }

    setBarLayout({ centersByHour, selectedPx })
  }, [barHours, selectedHour])

  useLayoutEffect(() => {
    measureBarLayout()
    const plot = plotRef.current
    if (!plot) return
    const observer = new ResizeObserver(measureBarLayout)
    observer.observe(plot)
    return () => observer.disconnect()
  }, [measureBarLayout])

  const barCenter = (hour: number): number | null => {
    const measured = barLayout.centersByHour[hour]
    if (measured != null) return measured
    const idx = displayHours.indexOf(hour)
    if (idx < 0) return null
    return barCenterPercent(idx, displayHours.length)
  }

  const selectedCenter = barCenter(selectedHour) ?? 50
  const hasMeasuredBars = barLayout.centersByHour[selectedHour] != null
  const labelPosition = floatingLabelPosition(selectedCenter)
  const labelAlign =
    selectedCenter <= 18
      ? 'items-start text-left'
      : selectedCenter >= 82
        ? 'items-end text-right'
        : 'items-center text-center'
  const accentColor = isLiveSelection && liveAlert ? '#dc2626' : LABEL_ACCENT_COLOR
  const secondaryHint = isLiveSelection
    ? liveSecondaryHint(selectedLive, selectedHistorical, dayPercentages)
    : historicalSecondaryHint(selectedHistorical, dayPercentages)

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
        <MatCapacityInfoPopover open={infoOpen} onClose={() => setInfoOpen(false)} />
      </div>

      <div className={`mb-4 flex justify-between border-b border-gray-100 ${CHART_INSET_X}`}>
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

      <div ref={plotRef} className={`relative ${CHART_INSET_X}`}>
        <div className="relative mb-1 min-h-10">
          <div
            className={`absolute bottom-0 flex w-max max-w-[min(280px,calc(100vw-3rem))] flex-col transition-[left,transform] duration-200 ease-out ${labelAlign}`}
            style={{
              left: labelPosition.left,
              transform: labelPosition.transform,
            }}
          >
            <div className="flex items-center gap-1.5 text-[13px] leading-snug">
              {isLiveSelection ? (
                <>
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
                  <span className="whitespace-nowrap">
                    <span className="font-semibold" style={{ color: accentColor }}>
                      Live:
                    </span>{' '}
                    <span className="font-normal text-gray-700">
                      {liveStatusLabel(selectedLive, selectedHistorical, dayPercentages)}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <Users
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: LABEL_ACCENT_COLOR }}
                    aria-hidden
                  />
                  <span className="whitespace-nowrap">
                    <span className="font-semibold" style={{ color: LABEL_ACCENT_COLOR }}>
                      {formatAxisHour(selectedHour)}:
                    </span>{' '}
                    <span className="font-normal text-gray-600">
                      {historicalStatusLabel(selectedHistorical, dayPercentages)}
                    </span>
                  </span>
                </>
              )}
            </div>
            {secondaryHint && (
              <p className="mt-0.5 text-[11px] italic text-gray-500">
                {secondaryHint}
              </p>
            )}
          </div>
        </div>

        <div
          className="pointer-events-none absolute top-10 bottom-5 z-20 w-px -translate-x-1/2 border-l border-dotted border-gray-400 transition-[left] duration-200 ease-out"
          style={{
            left: hasMeasuredBars ? barLayout.selectedPx : `${selectedCenter}%`,
          }}
          aria-hidden
        />

        <div
          className="relative border-b border-gray-300 pt-1"
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
              if (emptyHours.has(hour)) {
                return (
                  <div
                    key={hour}
                    className="min-w-0 flex-1"
                    style={{ height: CHART_HEIGHT_PX }}
                    aria-hidden
                  />
                )
              }

              const historicalPct = hourMap.get(hour)!
              const livePct = resolveLivePercentage(hour, historicalPct, liveByHour)
              const isLiveColumn = isToday && hour === liveHour && barHours.includes(hour)
              const isSelected = hour === selectedHour
              const histHeightPx = percentageToBarHeight(historicalPct, CHART_HEIGHT_PX)
              const liveHeightPx = percentageToBarHeight(livePct, CHART_HEIGHT_PX)
              const barColor =
                isSelected && !isLiveColumn ? SELECTED_BAR_COLOR : HISTORICAL_BAR_COLOR

              return (
                <button
                  key={hour}
                  ref={(node) => {
                    if (node) barRefs.current.set(hour, node)
                    else barRefs.current.delete(hour)
                  }}
                  type="button"
                  onClick={() => handleHourSelect(hour)}
                  className="relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end border-0 bg-transparent p-0"
                  style={{ height: CHART_HEIGHT_PX }}
                  aria-label={
                    isLiveColumn
                      ? `Live ${formatAxisHour(hour)}: ${liveStatusLabel(livePct, historicalPct, dayPercentages)}`
                      : `${formatAxisHour(hour)}: ${historicalStatusLabel(historicalPct, dayPercentages)}`
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
                        backgroundColor: barColor,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative mt-2 h-5">
          {ticks.map((tick) => {
            const center = barCenter(tick)
            if (center == null) return null
            return (
              <span
                key={tick}
                className="absolute -translate-x-1/2 text-[11px] text-gray-500"
                style={{ left: `${center}%` }}
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
