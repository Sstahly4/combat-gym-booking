export const TRAINING_SCHEDULE_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type TrainingScheduleDay = (typeof TRAINING_SCHEDULE_DAYS)[number]

export type TrainingScheduleSession = {
  time: string
  type?: string
}

export type TrainingSchedule = Record<TrainingScheduleDay, TrainingScheduleSession[]>

export type ParsedScheduleRow = {
  day: string
  time: string
  type?: string | null
}

export type ParsedScheduleVisionResult = {
  sessions: ParsedScheduleRow[]
  warnings?: string[]
}

export function emptyTrainingSchedule(): TrainingSchedule {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }
}

const DAY_ALIASES: Record<string, TrainingScheduleDay> = {
  mon: 'monday',
  monday: 'monday',
  tue: 'tuesday',
  tues: 'tuesday',
  tuesday: 'tuesday',
  wed: 'wednesday',
  wednesday: 'wednesday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  thursday: 'thursday',
  fri: 'friday',
  friday: 'friday',
  sat: 'saturday',
  saturday: 'saturday',
  sun: 'sunday',
  sunday: 'sunday',
}

export function normalizeScheduleDay(raw: string): TrainingScheduleDay | null {
  const key = raw.trim().toLowerCase().replace(/\./g, '')
  return DAY_ALIASES[key] ?? null
}

/** Collapse whitespace; keep human-readable ranges like "06:00-09:00". */
export function normalizeScheduleTime(raw: string): string {
  return raw
    .trim()
    .replace(/\s*[-–—]\s*/g, '-')
    .replace(/\s+/g, ' ')
}

export function normalizeScheduleType(raw: string | null | undefined): string | undefined {
  const t = (raw ?? '').trim()
  return t.length > 0 ? t : undefined
}

function sortKeyForTime(time: string): number {
  const match = time.match(/(\d{1,2})(?::(\d{2}))?/)
  if (!match) return 9999
  const hour = parseInt(match[1]!, 10)
  const minute = match[2] ? parseInt(match[2], 10) : 0
  return hour * 60 + minute
}

export function sortSessionsForDay(sessions: TrainingScheduleSession[]): TrainingScheduleSession[] {
  return [...sessions].sort((a, b) => sortKeyForTime(a.time) - sortKeyForTime(b.time))
}

/**
 * Convert vision model rows into gyms.training_schedule JSONB shape.
 * Invalid rows are skipped; duplicates (same day+time+type) are deduped.
 */
export function buildTrainingScheduleFromParsedRows(
  rows: ParsedScheduleRow[],
): { schedule: TrainingSchedule; skipped: number; sessionCount: number } {
  const schedule = emptyTrainingSchedule()
  const seen = new Set<string>()
  let skipped = 0

  for (const row of rows) {
    const day = normalizeScheduleDay(row.day ?? '')
    const time = normalizeScheduleTime(row.time ?? '')
    if (!day || !time) {
      skipped += 1
      continue
    }
    const type = normalizeScheduleType(row.type)
    const dedupeKey = `${day}|${time}|${type ?? ''}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    schedule[day].push(type ? { time, type } : { time })
  }

  for (const day of TRAINING_SCHEDULE_DAYS) {
    schedule[day] = sortSessionsForDay(schedule[day])
  }

  const sessionCount = TRAINING_SCHEDULE_DAYS.reduce((n, d) => n + schedule[d].length, 0)
  return { schedule, skipped, sessionCount }
}

export function countTrainingScheduleSessions(
  schedule: Record<string, TrainingScheduleSession[] | undefined> | null | undefined,
): number {
  if (!schedule) return 0
  return TRAINING_SCHEDULE_DAYS.reduce((n, day) => n + (schedule[day]?.length ?? 0), 0)
}

export function mergeTrainingSchedules(
  base: TrainingSchedule,
  incoming: TrainingSchedule,
): TrainingSchedule {
  const merged = emptyTrainingSchedule()
  for (const day of TRAINING_SCHEDULE_DAYS) {
    const combined = [...(base[day] ?? []), ...(incoming[day] ?? [])]
    const seen = new Set<string>()
    const unique: TrainingScheduleSession[] = []
    for (const session of combined) {
      if (!session.time.trim()) continue
      const key = `${session.time}|${session.type ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(session)
    }
    merged[day] = sortSessionsForDay(unique)
  }
  return merged
}
