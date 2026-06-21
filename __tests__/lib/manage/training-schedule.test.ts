import { describe, expect, it } from 'vitest'
import {
  buildTrainingScheduleFromParsedRows,
  mergeTrainingSchedules,
  normalizeScheduleDay,
  normalizeScheduleTime,
  emptyTrainingSchedule,
} from '@/lib/manage/training-schedule'

describe('normalizeScheduleDay', () => {
  it('maps common abbreviations', () => {
    expect(normalizeScheduleDay('Mon')).toBe('monday')
    expect(normalizeScheduleDay('THURS')).toBe('thursday')
    expect(normalizeScheduleDay('Sunday')).toBe('sunday')
  })

  it('returns null for garbage', () => {
    expect(normalizeScheduleDay('Funday')).toBeNull()
  })
})

describe('normalizeScheduleTime', () => {
  it('normalizes dash ranges', () => {
    expect(normalizeScheduleTime('6:00 – 8:00')).toBe('6:00-8:00')
  })
})

describe('buildTrainingScheduleFromParsedRows', () => {
  it('groups by day and dedupes', () => {
    const { schedule, sessionCount } = buildTrainingScheduleFromParsedRows([
      { day: 'monday', time: '18:00', type: 'BJJ' },
      { day: 'monday', time: '18:00', type: 'BJJ' },
      { day: 'Mon', time: '06:00-08:00', type: 'Muay Thai' },
      { day: 'tuesday', time: '09:00', type: 'Sparring' },
    ])

    expect(sessionCount).toBe(3)
    expect(schedule.monday).toHaveLength(2)
    expect(schedule.monday[0]?.time).toBe('06:00-08:00')
    expect(schedule.tuesday[0]?.type).toBe('Sparring')
  })

  it('skips invalid rows', () => {
    const { skipped, sessionCount } = buildTrainingScheduleFromParsedRows([
      { day: '', time: '09:00', type: 'X' },
      { day: 'wednesday', time: '', type: 'Y' },
      { day: 'wednesday', time: '10:00', type: 'OK' },
    ])
    expect(skipped).toBe(2)
    expect(sessionCount).toBe(1)
  })
})

describe('mergeTrainingSchedules', () => {
  it('combines without duplicates', () => {
    const base = emptyTrainingSchedule()
    base.monday = [{ time: '09:00', type: 'Muay Thai' }]
    const incoming = emptyTrainingSchedule()
    incoming.monday = [
      { time: '09:00', type: 'Muay Thai' },
      { time: '18:00', type: 'Sparring' },
    ]
    const merged = mergeTrainingSchedules(base, incoming)
    expect(merged.monday).toHaveLength(2)
  })
})
