import { DAYS_OF_WEEK, type DayBusyness, type DayOfWeek, type PopularTimes } from '@/lib/gym/busyness-types'

export const HISTORICAL_BAR_COLOR = '#003580'
export const SELECTED_BAR_COLOR = '#1a73e8'
export const LABEL_ACCENT_COLOR = '#1a73e8'
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
  /** Axis tick range — matches scraped data window (±1h padding), unchanged by spacers. */
  minHour: number
  maxHour: number
  /** Hours that render bars and accept selection. */
  dataHours: number[]
  /** dataHours plus one empty spacer column on each end (no bar). */
  displayHours: number[]
  spacerHours: ReadonlySet<number>
  hourMap: Map<number, number>
}

function hoursInRange(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function withEndSpacers(
  dataMin: number,
  dataMax: number,
): Pick<HourWindow, 'dataHours' | 'displayHours' | 'spacerHours'> {
  const dataHours = hoursInRange(dataMin, dataMax)
  const spacerHours = new Set<number>()
  const displayHours: number[] = []

  if (dataMin > 0) {
    spacerHours.add(dataMin - 1)
    displayHours.push(dataMin - 1)
  }
  displayHours.push(...dataHours)
  if (dataMax < 23) {
    spacerHours.add(dataMax + 1)
    displayHours.push(dataMax + 1)
  }

  return { dataHours, displayHours, spacerHours }
}

/**
 * Dynamic X-axis: earliest hour with activity > 0, latest ditto, padded ±1 hour for bars.
 * Adds one extra empty column before/after for label breathing room (no bar).
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
      hourMap,
      ...withEndSpacers(minHour, maxHour),
    }
  }

  const rawMin = Math.min(...active.map((h) => h.hour))
  const rawMax = Math.max(...active.map((h) => h.hour))
  const minHour = Math.max(0, rawMin - 1)
  const maxHour = Math.min(23, rawMax + 1)

  return {
    minHour,
    maxHour,
    hourMap,
    ...withEndSpacers(minHour, maxHour),
  }
}

/** Default hour when viewing a day that isn't today. */
export function defaultSelectedHour(dataHours: number[]): number {
  if (dataHours.length === 0) return 9
  if (dataHours.includes(9)) return 9
  return dataHours[0]
}

/** Pick the best hour for today: current gym hour if in range, else 9am fallback. */
export function todaySelectedHour(dataHours: number[], currentHour: number): number {
  if (dataHours.length === 0) return 9
  if (dataHours.includes(currentHour)) return currentHour
  return defaultSelectedHour(dataHours)
}

/** Mat-capacity band for a single hour within a day (5 tiers). */
export type BusynessTier = 'quiet' | 'light' | 'moderate' | 'busy' | 'peak'

const PEAK_NEAR_MAX_ABS = 5
const PEAK_NEAR_MAX_RATIO = 0.08
/** When the day is nearly flat, use absolute % bands instead of relative rank. */
const MIN_DAY_SPAN_FOR_RELATIVE = 12

function absoluteBusynessTier(percentage: number): BusynessTier {
  if (percentage <= 20) return 'quiet'
  if (percentage <= 40) return 'light'
  if (percentage <= 60) return 'moderate'
  if (percentage <= 80) return 'busy'
  return 'peak'
}

/**
 * Tier for one hour vs the rest of that day (ranks within the day's curve).
 * Peak is reserved for hours at or near the day's busiest slot.
 */
export function busynessTierForHour(
  percentage: number,
  dayPercentages: number[],
): BusynessTier {
  const values = dayPercentages.filter((p) => p > 0)
  if (values.length === 0) return absoluteBusynessTier(percentage)

  const max = Math.max(...values)
  const min = Math.min(...values)
  const peakFloor = max - Math.max(PEAK_NEAR_MAX_ABS, max * PEAK_NEAR_MAX_RATIO)

  if (max > 0 && percentage >= peakFloor) return 'peak'

  const span = max - min
  if (span < MIN_DAY_SPAN_FOR_RELATIVE) return absoluteBusynessTier(percentage)

  const position = (percentage - min) / span
  if (position < 0.25) return 'quiet'
  if (position < 0.5) return 'light'
  if (position < 0.75) return 'moderate'
  return 'busy'
}

const HISTORICAL_TIER_LABEL: Record<BusynessTier, string> = {
  quiet: 'Usually not too busy',
  light: 'Usually fairly quiet',
  moderate: 'Usually a little busy',
  busy: 'Usually busy',
  peak: 'Usually as busy as it gets',
}

const LIVE_TIER_LABEL: Record<BusynessTier, string> = {
  quiet: 'Not too busy',
  light: 'Fairly quiet',
  moderate: 'A little busy',
  busy: 'Busy',
  peak: 'As busy as it gets',
}

/** Historical expectation when user selects a non-live hour. */
export function historicalStatusLabel(
  percentage: number,
  dayPercentages: number[],
): string {
  return HISTORICAL_TIER_LABEL[busynessTierForHour(percentage, dayPercentages)]
}

/** Mat-capacity secondary hint below the main status line. */
export function historicalSecondaryHint(
  percentage: number,
  dayPercentages: number[],
): string | null {
  switch (busynessTierForHour(percentage, dayPercentages)) {
    case 'quiet':
      return 'Plenty of room to train'
    case 'light':
      return 'Easy to find space on the mats'
    case 'moderate':
      return 'Good availability on the mats'
    case 'busy':
      return 'One of the busier times of the day'
    case 'peak':
      return 'Typically reaches maximum mat capacity'
  }
}

/** Secondary hint when viewing the live hour. */
export function liveSecondaryHint(
  livePercentage: number,
  historicalPercentage: number,
  dayPercentages: number[],
): string | null {
  if (livePercentage < historicalPercentage - LIVE_COMPARISON_DELTA) {
    return 'More mat space than usual right now'
  }
  if (livePercentage > historicalPercentage + LIVE_COMPARISON_DELTA) {
    return 'Mats filling up faster than usual'
  }
  switch (busynessTierForHour(livePercentage, dayPercentages)) {
    case 'quiet':
      return 'Plenty of room to train'
    case 'light':
      return 'Easy to find space on the mats'
    case 'moderate':
      return 'Good availability on the mats'
    case 'busy':
      return 'One of the busier times of the day'
    case 'peak':
      return 'Typically reaches maximum mat capacity'
  }
}

/** Live readout comparing real-time vs historical baseline. */
export function liveStatusLabel(
  livePercentage: number,
  historicalPercentage: number,
  dayPercentages: number[],
): string {
  if (livePercentage > historicalPercentage + LIVE_COMPARISON_DELTA) {
    return 'Busier than usual'
  }
  if (livePercentage < historicalPercentage - LIVE_COMPARISON_DELTA) {
    return 'Less busy than usual'
  }
  return LIVE_TIER_LABEL[busynessTierForHour(livePercentage, dayPercentages)]
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

/** Bar center within the plot as 0–100 (evenly spaced columns). */
export function barCenterPercent(hourIndex: number, totalBars: number): number {
  if (totalBars <= 1) return 50
  return ((hourIndex + 0.5) / totalBars) * 100
}

/**
 * Smart floating label position — stays inside the plot at edges (Google-style).
 * Dotted line uses the raw center; label shifts alignment instead of clipping.
 */
export function floatingLabelPosition(centerPercent: number): {
  left: string
  transform: string
} {
  const edgeThreshold = 18
  if (centerPercent <= edgeThreshold) {
    return { left: '0%', transform: 'translateX(0)' }
  }
  if (centerPercent >= 100 - edgeThreshold) {
    return { left: '100%', transform: 'translateX(-100%)' }
  }
  return { left: `${centerPercent}%`, transform: 'translateX(-50%)' }
}
