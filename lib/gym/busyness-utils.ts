import { DAYS_OF_WEEK, type DayBusyness, type DayOfWeek, type PopularTimes } from '@/lib/gym/busyness-types'

export const HISTORICAL_BAR_COLOR = '#003580'
export const LIVE_HISTORICAL_GHOST_OPACITY = 0.4
export const LIVE_ALERT_COLOR = '#E87171'
export const LIVE_NORMAL_COLOR = '#002a66'

/** 100% occupancy reaches ~70% of plot height (Google leaves headroom above tallest bar). */
export const BAR_AREA_MAX_RATIO = 0.7

/** Minimum live vs historical gap before we call it "busier/less busy than usual". */
export const LIVE_COMPARISON_DELTA = 10

export function resolveChartTimezone(gymTimezone?: string | null): string {
  const trimmed = gymTimezone?.trim()
  if (trimmed) return trimmed
  if (typeof Intl !== 'undefined') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  return 'UTC'
}

export function normalizeDayKey(day: string): DayOfWeek | null {
  const lower = day.trim().toLowerCase()
  return DAYS_OF_WEEK.find((d) => d.toLowerCase() === lower) ?? null
}

export function findDayBusyness(
  data: PopularTimes,
  day: DayOfWeek,
): DayBusyness | undefined {
  return data.find((d) => normalizeDayKey(String(d.day)) === day || d.day === day)
}

/** Axis / display label: 9 → "9am", 12 → "12pm". */
export function formatAxisHour(hour: number): string {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

export interface HourWindow {
  minHour: number
  maxHour: number
  displayHours: number[]
  hourMap: Map<number, number>
}

/**
 * Dynamic X-axis: earliest hour with activity > 0, latest ditto, padded ±1 hour.
 * Falls back to 9am–9pm when the day has no activity.
 */
export function buildDynamicHourWindow(
  hours: { hour: number; percentage: number }[],
): HourWindow {
  const hourMap = new Map(hours.map((h) => [h.hour, h.percentage]))
  const active = hours.filter((h) => h.percentage > 0)

  if (active.length === 0) {
    const minHour = 9
    const maxHour = 21
    return {
      minHour,
      maxHour,
      displayHours: Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i),
      hourMap,
    }
  }

  const rawMin = Math.min(...active.map((h) => h.hour))
  const rawMax = Math.max(...active.map((h) => h.hour))
  const minHour = Math.max(0, rawMin - 1)
  const maxHour = Math.min(23, rawMax + 1)

  return {
    minHour,
    maxHour,
    displayHours: Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i),
    hourMap,
  }
}

/** Default hour when viewing a day that isn't today. */
export function defaultSelectedHour(displayHours: number[]): number {
  if (displayHours.length === 0) return 9
  if (displayHours.includes(9)) return 9
  return displayHours[0]
}

/** Pick the best hour for today: current gym hour if in range, else 9am fallback. */
export function todaySelectedHour(displayHours: number[], currentHour: number): number {
  if (displayHours.length === 0) return 9
  if (displayHours.includes(currentHour)) return currentHour
  return defaultSelectedHour(displayHours)
}

/** Historical expectation when user selects a non-live hour. */
export function historicalStatusLabel(percentage: number): string {
  if (percentage <= 35) return 'Usually not too busy'
  if (percentage <= 65) return 'Usually a little busy'
  return 'Usually as busy as it gets'
}

/** Live readout comparing real-time vs historical baseline. */
export function liveStatusLabel(livePercentage: number, historicalPercentage: number): string {
  if (livePercentage >= 85 && historicalPercentage >= 85) {
    return 'As busy as it gets'
  }
  if (livePercentage > historicalPercentage + LIVE_COMPARISON_DELTA) {
    return 'Busier than usual'
  }
  if (livePercentage < historicalPercentage - LIVE_COMPARISON_DELTA) {
    return 'Less busy than usual'
  }
  if (livePercentage <= 35) return 'Not too busy'
  if (livePercentage <= 65) return 'A little busy'
  return 'As busy as it gets'
}

export function isLiveAlert(livePercentage: number, historicalPercentage: number): boolean {
  return livePercentage > historicalPercentage
}

/** Foreground live bar: alert red only when live exceeds historical baseline. */
export function liveForegroundColor(
  livePercentage: number,
  historicalPercentage: number,
): string {
  if (isLiveAlert(livePercentage, historicalPercentage)) return LIVE_ALERT_COLOR
  return LIVE_NORMAL_COLOR
}

/** X-axis ticks every 3 hours within the visible window. */
export function axisTicksForWindow(minHour: number, maxHour: number): number[] {
  const ticks: number[] = []
  let h = Math.ceil(minHour / 3) * 3
  if (h < minHour) h += 3
  for (; h <= maxHour; h += 3) ticks.push(h)
  if (ticks.length === 0) ticks.push(minHour)
  return ticks
}

export function percentageToBarHeight(percentage: number, plotHeightPx: number): number {
  const maxBarPx = plotHeightPx * BAR_AREA_MAX_RATIO
  if (percentage <= 0) return 2
  return Math.max(3, Math.round((percentage / 100) * maxBarPx))
}

/** Horizontal grid line positions as fraction of plot height from bottom (Google-style). */
export const CHART_GRID_FRACTIONS = [0.25, 0.5, 0.75] as const

export function getGymLocalDateTime(timezone?: string | null): {
  day: DayOfWeek
  hour: number
} {
  const tz = resolveChartTimezone(timezone)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Monday'
  const rawHour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const hour = rawHour === 24 ? 0 : rawHour

  const day = DAYS_OF_WEEK.includes(weekday as DayOfWeek)
    ? (weekday as DayOfWeek)
    : 'Monday'

  return { day, hour }
}

/** Phase 2: pass real-time % per hour; Phase 1 falls back to historical. */
export function resolveLivePercentage(
  hour: number,
  historicalPercentage: number,
  liveByHour?: Record<number, number> | null,
): number {
  const live = liveByHour?.[hour]
  return live !== undefined && live !== null ? live : historicalPercentage
}
