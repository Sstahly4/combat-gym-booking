type TrainingSchedule = Record<string, Array<{ time: string; type?: string }>>

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function trainingScheduleSnippet(
  trainingSchedule: TrainingSchedule | null | undefined,
  maxDays = 2
): string | null {
  if (!trainingSchedule || typeof trainingSchedule !== 'object') return null

  const parts: string[] = []
  for (const day of DAY_ORDER) {
    const sessions = trainingSchedule[day]
    if (!sessions || sessions.length === 0) continue
    const label = day.slice(0, 3)
    const times = sessions
      .map((s) => s.time)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ')
    if (times) parts.push(`${label}: ${times}`)
    if (parts.length >= maxDays) break
  }

  return parts.length > 0 ? parts.join(' · ') : null
}
