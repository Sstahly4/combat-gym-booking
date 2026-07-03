import ical from 'node-ical'

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return toIsoDateUTC(dt)
}

/** Expand an iCal event to occupied calendar dates (check-in through night before check-out for all-day). */
function eventOccupiedDates(start: Date, end: Date, allDay: boolean): string[] {
  const dates: string[] = []
  let from = toIsoDateUTC(start)
  let to = toIsoDateUTC(end)

  if (allDay && from !== to) {
    // iCal all-day end is exclusive
    to = addDaysISO(to, -1)
  }

  if (to < from) return []

  let d = from
  while (d <= to) {
    dates.push(d)
    if (d === to) break
    d = addDaysISO(d, 1)
  }
  return dates
}

export type ParsedIcalBlock = {
  date: string
  summary: string | null
}

/**
 * Parse ICS text into busy dates. Returns unique dates with optional summaries.
 */
export function parseIcalBusyDates(icsText: string): ParsedIcalBlock[] {
  const parsed = ical.parseICS(icsText)
  const byDate = new Map<string, string | null>()

  for (const item of Object.values(parsed)) {
    if (!item || typeof item !== 'object') continue
    if ((item as { type?: string }).type !== 'VEVENT') continue

    const ev = item as {
      start?: Date
      end?: Date
      summary?: string
      datetype?: string
    }

    if (!ev.start || !ev.end) continue
    const allDay = ev.datetype === 'date' || ev.datetype === 'dates'
    const occupied = eventOccupiedDates(ev.start, ev.end, allDay)
    const summary = ev.summary?.trim() || null

    for (const date of occupied) {
      if (!DATE_RX.test(date)) continue
      if (!byDate.has(date)) byDate.set(date, summary)
    }
  }

  return [...byDate.entries()]
    .map(([date, summary]) => ({ date, summary }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function fetchIcalText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Accept: 'text/calendar' },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    throw new Error(`Could not fetch calendar (${res.status})`)
  }
  const text = await res.text()
  if (!text.includes('BEGIN:VCALENDAR')) {
    throw new Error('URL did not return a valid iCalendar feed')
  }
  return text
}
