import { DAYS_OF_WEEK, type DayOfWeek } from '@/lib/gym/busyness-types'

/** Google-style axis label: 9 → "9a", 12 → "12p", 21 → "9p". */
export function formatAxisHour(hour: number): string {
  if (hour === 0) return '12a'
  if (hour < 12) return `${hour}a`
  if (hour === 12) return '12p'
  return `${hour - 12}p`
}

/** Google Popular Times status copy for a busyness percentage. */
export function busynessStatusLabel(percentage: number): string {
  if (percentage < 25) return 'Not busy'
  if (percentage < 45) return 'A little busy'
  if (percentage < 65) return 'Usually busy'
  if (percentage < 85) return 'Very busy'
  return 'As busy as it gets'
}

/** Live bar turns red at this threshold (matches Google-style emphasis). */
export const LIVE_BAR_BUSY_THRESHOLD = 55

export function isLiveBarHighlighted(percentage: number): boolean {
  return percentage >= LIVE_BAR_BUSY_THRESHOLD
}

export function barFillColor(percentage: number, isLiveHour: boolean): string {
  const BAR_COLOR = '#8ab4f8'
  const LIVE_BAR_COLOR = '#e87171'
  if (isLiveHour && isLiveBarHighlighted(percentage)) return LIVE_BAR_COLOR
  return BAR_COLOR
}

/** Standard Google Popular Times x-axis labels. */
export const GOOGLE_AXIS_HOURS = [9, 12, 15, 18, 21] as const

export function googleAxisTicks(minHour: number, maxHour: number): number[] {
  return GOOGLE_AXIS_HOURS.filter((h) => h >= minHour && h <= maxHour)
}

/** Position a tick label along the chart (0–100%). */
export function hourChartPosition(hour: number, minHour: number, maxHour: number): number {
  if (maxHour <= minHour) return 50
  return ((hour - minHour) / (maxHour - minHour)) * 100
}

export function getGymLocalDateTime(timezone?: string | null): {
  day: DayOfWeek
  hour: number
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone?.trim() || 'UTC',
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
