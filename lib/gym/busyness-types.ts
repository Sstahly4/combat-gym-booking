export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export const DAY_ABBREVIATIONS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

export interface HourlyBusyness {
  hour: number
  percentage: number
}

export interface DayBusyness {
  day: DayOfWeek
  hours: HourlyBusyness[]
}

export type PopularTimes = DayBusyness[]

export type BusynessSource = 'google' | 'nearby_clone' | 'template' | 'unknown'

export interface GymBusynessRecord {
  id: string
  gym_id: string
  popular_times: PopularTimes
  source: BusynessSource
  updated_at: string
}

export function isPopularTimesEmpty(data: PopularTimes | null | undefined): boolean {
  if (!data || data.length === 0) return true
  return data.every((day) => day.hours.length === 0)
}

export function hasDisplayableBusyness(record: GymBusynessRecord | null): boolean {
  if (!record) return false
  return hasMeaningfulBusynessData(record.popular_times)
}

/** At least one day with an hour above 0% (excludes empty JSON and all-zero curves). */
export function hasMeaningfulBusynessData(data: PopularTimes | null | undefined): boolean {
  if (!data || data.length === 0) return false
  return data.some((day) => day.hours.some((h) => h.percentage > 0))
}
