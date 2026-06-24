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
  if (percentage <= 25) return 'Not busy'
  if (percentage <= 50) return 'A little busy'
  if (percentage <= 75) return 'Usually busy'
  if (percentage <= 90) return 'Very busy'
  return 'As busy as it gets'
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

/** Hours to show on the x-axis (every 3h within range). */
export function axisTickHours(minHour: number, maxHour: number): number[] {
  const ticks: number[] = []
  const start = Math.ceil(minHour / 3) * 3
  for (let h = start; h <= maxHour; h += 3) {
    ticks.push(h)
  }
  if (ticks.length === 0) ticks.push(minHour)
  return ticks
}
