'use client'

/**
 * Owner "Calendar & availability" monthly grid.
 *
 * Inspired by Booking.com extranet: color-coded dates (green/yellow/red/gray)
 * with a Stripe-style quick-edit popover for per-day price, capacity, and closures.
 *
 * Data lives under /api/manage/calendar and is keyed by (gym_id, date). Booking counts
 * are computed live on the server so the grid is always in sync with the bookings table.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, ChevronLeft, ChevronRight, X, Lock, Unlock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatDashboardMoneyCompact } from '@/lib/currency/format-dashboard-money'

type DayStatus = 'open' | 'partial' | 'sold_out' | 'closed' | 'unconfigured'

type CalendarDay = {
  date: string
  price: number
  price_override: number | null
  capacity: number | null
  capacity_override: number | null
  is_closed: boolean
  min_stay_override: number | null
  note: string | null
  booked: number
  spots_left: number | null
  status: DayStatus
}

type CalendarResponse = {
  gym: {
    id: string
    currency: string
    default_price: number
    default_daily_capacity: number | null
    timezone: string | null
  }
  range: { from: string; to: string }
  days: CalendarDay[]
}

// ---------- date helpers (UTC, ISO YYYY-MM-DD) ----------
function toIso(year: number, monthIdx: number, day: number): string {
  const mm = String(monthIdx + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}
function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m: m - 1, d }
}
function daysInMonth(year: number, monthIdx: number): number {
  return new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate()
}
function monthLabel(year: number, monthIdx: number): string {
  return new Date(Date.UTC(year, monthIdx, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
function todayIso(): string {
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth(), now.getDate())
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// status → pill / cell styling (booking.com-esque semantics)
const STATUS_STYLES: Record<
  DayStatus,
  { dot: string; label: string; bar: string; ring: string }
> = {
  open: {
    dot: 'bg-emerald-500',
    label: 'Open',
    bar: 'bg-emerald-500',
    ring: 'hover:ring-emerald-400/60',
  },
  partial: {
    dot: 'bg-amber-500',
    label: 'Partial',
    bar: 'bg-amber-500',
    ring: 'hover:ring-amber-400/60',
  },
  sold_out: {
    dot: 'bg-red-500',
    label: 'Sold out',
    bar: 'bg-red-500',
    ring: 'hover:ring-red-400/60',
  },
  closed: {
    dot: 'bg-gray-900',
    label: 'Closed',
    bar: 'bg-gray-900',
    ring: 'hover:ring-gray-500/60',
  },
  unconfigured: {
    dot: 'bg-gray-300',
    label: 'No capacity set',
    bar: 'bg-gray-300',
    ring: 'hover:ring-gray-300/80',
  },
}

export function CalendarAvailabilityGrid({ gymId }: { gymId: string }) {
  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return { year: t.getFullYear(), month: t.getMonth() }
  })
  const [data, setData] = useState<CalendarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDate, setEditDate] = useState<string | null>(null)
  const [savingDefault, setSavingDefault] = useState(false)
  const [defaultCapDraft, setDefaultCapDraft] = useState<string>('')

  const fromIso = useMemo(() => toIso(cursor.year, cursor.month, 1), [cursor])
  const toIsoEnd = useMemo(
    () => toIso(cursor.year, cursor.month, daysInMonth(cursor.year, cursor.month)),
    [cursor]
  )

  const loadRange = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ gym_id: gymId, from: fromIso, to: toIsoEnd })
      const res = await fetch(`/api/manage/calendar?${qs.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load calendar')
      setData(json as CalendarResponse)
      setDefaultCapDraft(
        json?.gym?.default_daily_capacity == null
          ? ''
          : String(json.gym.default_daily_capacity)
      )
    } catch (e: any) {
      setError(e?.message || 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [gymId, fromIso, toIsoEnd])

  useEffect(() => {
    if (!gymId) return
    loadRange()
  }, [gymId, loadRange])

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarDay>()
    for (const d of data?.days ?? []) map.set(d.date, d)
    return map
  }, [data])

  const currency = data?.gym.currency ?? 'USD'
  const defaultCapacity = data?.gym.default_daily_capacity ?? null
  const today = todayIso()

  const prevMonth = () =>
    setCursor((c) =>
      c.month === 0
        ? { year: c.year - 1, month: 11 }
        : { year: c.year, month: c.month - 1 }
    )
  const nextMonth = () =>
    setCursor((c) =>
      c.month === 11
        ? { year: c.year + 1, month: 0 }
        : { year: c.year, month: c.month + 1 }
    )

  const handleSaveDefault = async () => {
    if (!data) return
    const raw = defaultCapDraft.trim()
    const cap = raw === '' ? null : Number(raw)
    if (cap != null && (!Number.isFinite(cap) || cap < 0 || cap > 10_000)) {
      setError('Default capacity must be 0–10,000')
      return
    }
    setSavingDefault(true)
    try {
      const res = await fetch('/api/manage/calendar/defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gym_id: gymId, default_daily_capacity: cap }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save')
      await loadRange()
    } catch (e: any) {
      setError(e?.message || 'Failed to save default capacity')
    } finally {
      setSavingDefault(false)
    }
  }

  // Build the calendar grid cells (Monday-start, with leading blanks).
  const firstDow = (() => {
    // getUTCDay: Sun=0..Sat=6; convert to Mon=0..Sun=6
    const d = new Date(Date.UTC(cursor.year, cursor.month, 1)).getUTCDay()
    return (d + 6) % 7
  })()
  const numDays = daysInMonth(cursor.year, cursor.month)
  const cells: Array<{ iso: string | null; day: number | null }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ iso: null, day: null })
  for (let d = 1; d <= numDays; d++) {
    cells.push({ iso: toIso(cursor.year, cursor.month, d), day: d })
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null })

  const editing = editDate ? byDate.get(editDate) ?? null : null

  // Summary counts for the legend bar
  const summary = useMemo(() => {
    const counts = { open: 0, partial: 0, sold_out: 0, closed: 0, unconfigured: 0 }
    for (const d of data?.days ?? []) counts[d.status]++
    return counts
  }, [data])

  return (
    <div>
      {/* Top controls row: month pager + default capacity */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <div className="min-w-[10.5rem] text-center text-sm font-semibold text-gray-900">
            {monthLabel(cursor.year, cursor.month)}
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => {
              const t = new Date()
              setCursor({ year: t.getFullYear(), month: t.getMonth() })
            }}
            className="ml-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="default-capacity" className="text-xs font-medium text-gray-500">
            Default spots / day
          </Label>
          <Input
            id="default-capacity"
            type="number"
            min={0}
            max={10000}
            inputMode="numeric"
            placeholder="e.g. 20"
            value={defaultCapDraft}
            onChange={(e) => setDefaultCapDraft(e.target.value)}
            className="h-9 w-24 text-sm"
          />
          <Button
            type="button"
            onClick={handleSaveDefault}
            disabled={savingDefault}
            className="h-9"
          >
            {savingDefault ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
        {(['open', 'partial', 'sold_out', 'closed', 'unconfigured'] as DayStatus[]).map(
          (s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={cn('inline-block h-2 w-2 rounded-full', STATUS_STYLES[s].dot)} />
              <span>
                {STATUS_STYLES[s].label}
                <span className="ml-1 tabular-nums text-gray-400">
                  · {summary[s]}
                </span>
              </span>
            </div>
          )
        )}
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {defaultCapacity == null ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Set a default number of spots per day to start tracking availability and avoid
          overbookings. You can still override individual dates.
        </div>
      ) : null}

      {/* Weekday header */}
      <div className="mt-4 grid grid-cols-7 gap-1 px-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center">
            {w}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className={cn(
          'relative mt-1 grid grid-cols-7 gap-1.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm',
          loading && 'opacity-60'
        )}
        aria-busy={loading}
      >
        {loading && !data ? (
          <div className="col-span-7 flex items-center justify-center py-20 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading availability…
          </div>
        ) : (
          cells.map((cell, idx) =>
            cell.iso ? (
              <DayCell
                key={cell.iso}
                day={byDate.get(cell.iso)}
                iso={cell.iso}
                dayNum={cell.day!}
                currency={currency}
                isToday={cell.iso === today}
                onClick={() => setEditDate(cell.iso)}
              />
            ) : (
              <div key={`blank-${idx}`} className="h-20 sm:h-24" aria-hidden />
            )
          )
        )}
      </div>

      {/* Edit dialog */}
      {editing ? (
        <EditDayDialog
          gymId={gymId}
          day={editing}
          currency={currency}
          defaultCapacity={defaultCapacity}
          defaultPrice={data?.gym.default_price ?? 0}
          onClose={() => setEditDate(null)}
          onSaved={async () => {
            setEditDate(null)
            await loadRange()
          }}
        />
      ) : null}
    </div>
  )
}

// ---------- Day cell ----------
function DayCell({
  day,
  iso,
  dayNum,
  currency,
  isToday,
  onClick,
}: {
  day: CalendarDay | undefined
  iso: string
  dayNum: number
  currency: string
  isToday: boolean
  onClick: () => void
}) {
  const status: DayStatus = day?.status ?? 'unconfigured'
  const styles = STATUS_STYLES[status]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex h-20 flex-col justify-between rounded-lg border border-gray-200 bg-white p-1.5 text-left text-xs transition',
        'hover:-translate-y-px hover:shadow-sm hover:ring-2',
        styles.ring,
        'sm:h-24 sm:p-2'
      )}
      aria-label={`${iso}: ${styles.label}`}
    >
      <div className={cn('absolute left-0 top-0 h-1 w-full rounded-t-lg', styles.bar)} />

      <div className="mt-1 flex items-start justify-between">
        <span
          className={cn(
            'tabular-nums text-sm font-semibold',
            isToday ? 'text-[#003580]' : 'text-gray-900'
          )}
        >
          {dayNum}
          {isToday ? (
            <span className="ml-1 rounded bg-[#003580]/10 px-1 py-0.5 text-[9px] font-medium tracking-wide text-[#003580]">
              TODAY
            </span>
          ) : null}
        </span>
        {day?.is_closed ? (
          <Lock className="h-3 w-3 text-gray-500" aria-label="Closed" />
        ) : null}
      </div>

      {day ? (
        <div className="flex flex-col gap-0.5">
          <span className="truncate text-[11px] font-medium text-gray-900">
            {formatDashboardMoneyCompact(day.price, currency)}
            {day.price_override != null ? (
              <span className="ml-1 text-[9px] font-normal uppercase tracking-wide text-amber-600">
                override
              </span>
            ) : null}
          </span>
          <span className="truncate text-[10px] text-gray-500">
            {day.is_closed
              ? 'Closed'
              : day.capacity == null
              ? 'No cap'
              : day.capacity === 0
              ? '0 spots'
              : `${day.spots_left ?? 0}/${day.capacity} left`}
          </span>
        </div>
      ) : (
        <div className="text-[10px] text-gray-400">—</div>
      )}
    </button>
  )
}

// ---------- Edit dialog ----------
function EditDayDialog({
  gymId,
  day,
  currency,
  defaultCapacity,
  defaultPrice,
  onClose,
  onSaved,
}: {
  gymId: string
  day: CalendarDay
  currency: string
  defaultCapacity: number | null
  defaultPrice: number
  onClose: () => void
  onSaved: () => Promise<void> | void
}) {
  const [price, setPrice] = useState<string>(
    day.price_override == null ? '' : String(day.price_override)
  )
  const [capacity, setCapacity] = useState<string>(
    day.capacity_override == null ? '' : String(day.capacity_override)
  )
  const [isClosed, setIsClosed] = useState<boolean>(day.is_closed)
  const [minStay, setMinStay] = useState<string>(
    day.min_stay_override == null ? '' : String(day.min_stay_override)
  )
  const [note, setNote] = useState<string>(day.note ?? '')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const prettyDate = useMemo(() => {
    const { y, m, d } = parseIso(day.date)
    return new Date(Date.UTC(y, m, d)).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }, [day.date])

  const submit = async () => {
    setLocalError(null)

    const priceNum = price.trim() === '' ? null : Number(price)
    const capNum = capacity.trim() === '' ? null : Number(capacity)
    const minStayNum = minStay.trim() === '' ? null : Number(minStay)

    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      setLocalError('Price must be a positive number')
      return
    }
    if (capNum != null && (!Number.isFinite(capNum) || capNum < 0 || capNum > 10_000)) {
      setLocalError('Capacity must be between 0 and 10,000')
      return
    }
    if (capNum != null && capNum < day.booked) {
      setLocalError(
        `Capacity can't be lower than current bookings (${day.booked}) for this date`
      )
      return
    }
    if (minStayNum != null && (!Number.isInteger(minStayNum) || minStayNum < 1)) {
      setLocalError('Minimum stay must be at least 1 night')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/manage/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymId,
          date: day.date,
          price_override: priceNum,
          capacity_override: capNum,
          is_closed: isClosed,
          min_stay_override: minStayNum,
          note: note.trim() === '' ? null : note.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save')
      await onSaved()
    } catch (e: any) {
      setLocalError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const clearOverride = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/manage/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gym_id: gymId, date: day.date, clear: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to clear')
      await onSaved()
    } catch (e: any) {
      setLocalError(e?.message || 'Failed to clear override')
    } finally {
      setSaving(false)
    }
  }

  const hasAnyOverride =
    day.price_override != null ||
    day.capacity_override != null ||
    day.is_closed ||
    day.min_stay_override != null ||
    (day.note ?? '').length > 0

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(480px,calc(100vw-2rem))] p-0">
        <DialogHeader className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Edit {prettyDate}
            </DialogTitle>
            <p className="mt-0.5 text-xs text-gray-500">
              {day.booked} booked ·{' '}
              {day.capacity == null
                ? 'no capacity set'
                : `${day.spots_left ?? 0} of ${day.capacity} spots left`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-5 p-5">
          {/* Closed toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="flex items-center gap-2">
              {isClosed ? (
                <Lock className="h-4 w-4 text-gray-700" />
              ) : (
                <Unlock className="h-4 w-4 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Close this date</p>
                <p className="text-xs text-gray-500">
                  Blocks new bookings for holidays or maintenance.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsClosed((v) => !v)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                isClosed ? 'bg-gray-900' : 'bg-gray-300'
              )}
              aria-pressed={isClosed}
              aria-label="Toggle closed"
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                  isClosed ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price" className="text-xs font-medium text-gray-600">
                Price ({currency.toUpperCase()})
              </Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder={String(defaultPrice)}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Leave empty to use default ({formatDashboardMoneyCompact(defaultPrice, currency)})
              </p>
            </div>

            <div>
              <Label htmlFor="capacity" className="text-xs font-medium text-gray-600">
                Spots
              </Label>
              <Input
                id="capacity"
                type="number"
                min={0}
                max={10000}
                inputMode="numeric"
                placeholder={defaultCapacity == null ? 'Unlimited' : String(defaultCapacity)}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                {defaultCapacity == null
                  ? 'Leave empty for unlimited'
                  : `Leave empty for default (${defaultCapacity})`}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="min-stay" className="text-xs font-medium text-gray-600">
              Minimum stay (nights)
            </Label>
            <Input
              id="min-stay"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="None"
              value={minStay}
              onChange={(e) => setMinStay(e.target.value)}
              className="mt-1 max-w-[160px]"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Optional restriction (e.g. weekends require 2-night stay).
            </p>
          </div>

          <div>
            <Label htmlFor="note" className="text-xs font-medium text-gray-600">
              Internal note
            </Label>
            <Input
              id="note"
              type="text"
              maxLength={200}
              placeholder="e.g. Songkran holiday"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>

          {localError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {localError}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-4">
          {hasAnyOverride ? (
            <button
              type="button"
              onClick={clearOverride}
              disabled={saving}
              className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Reset to defaults
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-9"
            >
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={saving} className="h-9">
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
