'use client'

/**
 * Owner calendar — OTA-style monthly grid with multi-month view, range editing,
 * booking chips, and compact toolbar (sync, defaults, variant filter).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Unlock,
  Info,
  MousePointer2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CalendarSyncToolbar } from '@/components/manage/calendar-sync-toolbar'
import { cn } from '@/lib/utils'
import { formatDashboardMoneyCompact } from '@/lib/currency/format-dashboard-money'
import type {
  CalendarReservationChip,
  GymDayAvailability,
  GymVariantOption,
} from '@/lib/booking/gym-availability'
import { addDaysISO } from '@/lib/booking/gym-availability'

type DayStatus = GymDayAvailability['status']

type CalendarResponse = {
  gym: {
    id: string
    currency: string
    default_price: number
    default_daily_capacity: number | null
    timezone: string | null
    booking_advance_min_days: number | null
    booking_advance_max_days: number | null
  }
  range: { from: string; to: string }
  days: GymDayAvailability[]
  variants: GymVariantOption[]
  package_variant_id: string | null
}

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

function datesBetweenInclusive(a: string, b: string): string[] {
  const [from, to] = a <= b ? [a, b] : [b, a]
  const out: string[] = []
  let d = from
  while (d <= to) {
    out.push(d)
    if (d === to) break
    d = addDaysISO(d, 1)
  }
  return out
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_STYLES: Record<
  DayStatus,
  { dot: string; label: string; bg: string; ring: string; dotRing?: string }
> = {
  open: {
    dot: 'bg-emerald-500',
    label: 'Open',
    bg: 'bg-emerald-50/50',
    ring: 'hover:ring-emerald-400/25',
    dotRing: 'ring-emerald-200',
  },
  partial: {
    dot: 'bg-amber-500',
    label: 'Partial',
    bg: 'bg-amber-50/55',
    ring: 'hover:ring-amber-400/25',
    dotRing: 'ring-amber-200',
  },
  sold_out: {
    dot: 'bg-red-500',
    label: 'Sold out',
    bg: 'bg-rose-50/60',
    ring: 'hover:ring-rose-400/25',
    dotRing: 'ring-rose-200',
  },
  closed: {
    dot: 'bg-gray-900',
    label: 'Closed',
    bg: 'bg-gray-100/60',
    ring: 'hover:ring-gray-400/25',
    dotRing: 'ring-gray-200',
  },
  import_blocked: {
    dot: 'bg-indigo-500',
    label: 'Imported block',
    bg: 'bg-indigo-50/55',
    ring: 'hover:ring-indigo-400/25',
    dotRing: 'ring-indigo-200',
  },
  unconfigured: {
    dot: 'bg-gray-300',
    label: 'No capacity set',
    bg: 'bg-white',
    ring: 'hover:ring-gray-300/35',
    dotRing: 'ring-gray-200',
  },
}

export function CalendarAvailabilityGrid({
  gymId,
  packageVariantId = null,
  onVariantFilterChange,
}: {
  gymId: string
  packageVariantId?: string | null
  onVariantFilterChange?: (variantId: string | null) => void
}) {
  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return { year: t.getFullYear(), month: t.getMonth() }
  })
  const [monthsVisible, setMonthsVisible] = useState<1 | 2>(2)
  const [data, setData] = useState<CalendarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDate, setEditDate] = useState<string | null>(null)
  const [detailDate, setDetailDate] = useState<string | null>(null)
  const [rangeSelectActive, setRangeSelectActive] = useState(false)
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [savingDefault, setSavingDefault] = useState(false)
  const [defaultCapDraft, setDefaultCapDraft] = useState('')
  const [defaultPriceDraft, setDefaultPriceDraft] = useState('')
  const [advanceMinDraft, setAdvanceMinDraft] = useState('')
  const [advanceMaxDraft, setAdvanceMaxDraft] = useState('')

  const monthOffsets = useMemo(
    () => Array.from({ length: monthsVisible }, (_, i) => i),
    [monthsVisible]
  )

  const fromIso = useMemo(() => toIso(cursor.year, cursor.month, 1), [cursor])
  const toIsoEnd = useMemo(() => {
    const endMonth = cursor.month + monthsVisible - 1
    const endYear = cursor.year + Math.floor(endMonth / 12)
    const endMonthIdx = ((endMonth % 12) + 12) % 12
    return toIso(endYear, endMonthIdx, daysInMonth(endYear, endMonthIdx))
  }, [cursor, monthsVisible])

  const loadRange = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ gym_id: gymId, from: fromIso, to: toIsoEnd })
      if (packageVariantId) qs.set('package_variant_id', packageVariantId)
      const res = await fetch(`/api/manage/calendar?${qs.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load calendar')
      setData(json as CalendarResponse)
      setDefaultCapDraft(
        json?.gym?.default_daily_capacity == null
          ? ''
          : String(json.gym.default_daily_capacity)
      )
      setDefaultPriceDraft(
        json?.gym?.default_price == null ? '' : String(json.gym.default_price)
      )
      setAdvanceMinDraft(
        json?.gym?.booking_advance_min_days == null
          ? ''
          : String(json.gym.booking_advance_min_days)
      )
      setAdvanceMaxDraft(
        json?.gym?.booking_advance_max_days == null
          ? ''
          : String(json.gym.booking_advance_max_days)
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [gymId, fromIso, toIsoEnd, packageVariantId])

  useEffect(() => {
    if (!gymId) return
    void loadRange()
  }, [gymId, loadRange])

  const byDate = useMemo(() => {
    const map = new Map<string, GymDayAvailability>()
    for (const d of data?.days ?? []) map.set(d.date, d)
    return map
  }, [data])

  const currency = data?.gym.currency ?? 'USD'
  const defaultCapacity = data?.gym.default_daily_capacity ?? null
  const defaultPrice = data?.gym.default_price ?? 0
  const today = todayIso()

  const prevMonth = () =>
    setCursor((c) => {
      const m = c.month - 1
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m }
    })

  const nextMonth = () =>
    setCursor((c) => {
      const m = c.month + 1
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m }
    })

  const goToday = () => {
    const t = new Date()
    setCursor({ year: t.getFullYear(), month: t.getMonth() })
  }

  const handleSaveDefaults = async () => {
    if (!data) return
    const capRaw = defaultCapDraft.trim()
    const priceRaw = defaultPriceDraft.trim()
    const advanceMinRaw = advanceMinDraft.trim()
    const advanceMaxRaw = advanceMaxDraft.trim()
    const cap = capRaw === '' ? null : Number(capRaw)
    const price = priceRaw === '' ? null : Number(priceRaw)
    const advanceMin = advanceMinRaw === '' ? null : Number(advanceMinRaw)
    const advanceMax = advanceMaxRaw === '' ? null : Number(advanceMaxRaw)
    if (cap != null && (!Number.isFinite(cap) || cap < 0 || cap > 10_000)) {
      setError('Default capacity must be 0–10,000')
      return
    }
    if (price != null && (!Number.isFinite(price) || price < 0)) {
      setError('Default price must be a positive number')
      return
    }
    if (advanceMin != null && (!Number.isInteger(advanceMin) || advanceMin < 0)) {
      setError('Min advance days must be 0 or more')
      return
    }
    if (advanceMax != null && (!Number.isInteger(advanceMax) || advanceMax < 1)) {
      setError('Max advance days must be at least 1')
      return
    }
    setSavingDefault(true)
    try {
      const res = await fetch('/api/manage/calendar/defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymId,
          default_daily_capacity: cap,
          default_price: price,
          booking_advance_min_days: advanceMin,
          booking_advance_max_days: advanceMax,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save')
      await loadRange()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save defaults')
    } finally {
      setSavingDefault(false)
    }
  }

  const handleDayClick = (iso: string) => {
    if (rangeSelectActive) {
      if (!rangeAnchor) {
        setRangeAnchor(iso)
        setSelectedDates(new Set([iso]))
        return
      }
      const range = datesBetweenInclusive(rangeAnchor, iso)
      setSelectedDates(new Set(range))
      setRangeAnchor(null)
      return
    }
    setDetailDate(iso)
  }

  const clearSelection = () => {
    setSelectedDates(new Set())
    setRangeAnchor(null)
    setRangeSelectActive(false)
  }

  const summary = useMemo(() => {
    const counts = {
      open: 0,
      partial: 0,
      sold_out: 0,
      closed: 0,
      import_blocked: 0,
      unconfigured: 0,
    }
    for (const d of data?.days ?? []) counts[d.status]++
    return counts
  }, [data])

  const editing = editDate ? byDate.get(editDate) ?? null : null
  const detailDay = detailDate ? byDate.get(detailDate) ?? null : null

  const headerLabel =
    monthsVisible === 2
      ? `${monthLabel(cursor.year, cursor.month)} – ${monthLabel(
          cursor.month === 11 ? cursor.year + 1 : cursor.year,
          (cursor.month + 1) % 12
        )}`
      : monthLabel(cursor.year, cursor.month)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <div className="min-w-[9rem] text-center text-sm font-semibold text-gray-900 sm:min-w-[12rem]">
                {headerLabel}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Today
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden items-center gap-1 rounded-full border border-gray-200 p-0.5 sm:flex">
                <button
                  type="button"
                  onClick={() => setMonthsVisible(1)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    monthsVisible === 1 ? 'bg-[#003580] text-white' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  1 mo
                </button>
                <button
                  type="button"
                  onClick={() => setMonthsVisible(2)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    monthsVisible === 2 ? 'bg-[#003580] text-white' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  2 mo
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'h-9 border-gray-200',
                  rangeSelectActive && 'border-[#003580] bg-[#003580]/5 text-[#003580]'
                )}
                onClick={() => {
                  setRangeSelectActive((v) => !v)
                  setRangeAnchor(null)
                  setSelectedDates(new Set())
                }}
              >
                <MousePointer2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Select range
              </Button>

              <CalendarSyncToolbar
                gymId={gymId}
                packageVariantId={packageVariantId}
                onImportChanged={() => void loadRange()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              {(data?.variants?.length ?? 0) > 0 && onVariantFilterChange ? (
                <div className="min-w-[10rem]">
                  <Label className="text-[11px] font-medium text-gray-500">View</Label>
                  <Select
                    value={packageVariantId ?? ''}
                    onChange={(e) =>
                      onVariantFilterChange(e.target.value ? e.target.value : null)
                    }
                    className="mt-1 h-9 text-sm"
                  >
                    <option value="">All bookings</option>
                    {data?.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.package_name ? `${v.package_name} · ` : ''}
                        {v.name}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}

              <div>
                <div className="flex items-center gap-1">
                  <Label htmlFor="default-capacity" className="text-[11px] font-medium text-gray-500">
                    Default spots / day
                  </Label>
                  <Info className="h-3 w-3 text-gray-400" aria-hidden />
                </div>
                <Input
                  id="default-capacity"
                  type="number"
                  min={0}
                  max={10000}
                  placeholder="e.g. 20"
                  value={defaultCapDraft}
                  onChange={(e) => setDefaultCapDraft(e.target.value)}
                  className="mt-1 h-9 w-24 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="default-price" className="text-[11px] font-medium text-gray-500">
                  Default price ({currency.toUpperCase()})
                </Label>
                <Input
                  id="default-price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={defaultPriceDraft}
                  onChange={(e) => setDefaultPriceDraft(e.target.value)}
                  className="mt-1 h-9 w-28 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="advance-min" className="text-[11px] font-medium text-gray-500">
                  Min advance (days)
                </Label>
                <Input
                  id="advance-min"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={advanceMinDraft}
                  onChange={(e) => setAdvanceMinDraft(e.target.value)}
                  className="mt-1 h-9 w-24 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="advance-max" className="text-[11px] font-medium text-gray-500">
                  Max advance (days)
                </Label>
                <Input
                  id="advance-max"
                  type="number"
                  min={1}
                  placeholder="∞"
                  value={advanceMaxDraft}
                  onChange={(e) => setAdvanceMaxDraft(e.target.value)}
                  className="mt-1 h-9 w-24 text-sm"
                />
              </div>

              <Button
                type="button"
                onClick={() => void handleSaveDefaults()}
                disabled={savingDefault}
                className="h-9"
              >
                {savingDefault ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save defaults'
                )}
              </Button>
            </div>

            {data?.gym.timezone ? (
              <p className="text-[11px] text-gray-400">Timezone: {data.gym.timezone}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs text-gray-600">
        {(
          ['open', 'partial', 'sold_out', 'closed', 'import_blocked', 'unconfigured'] as DayStatus[]
        ).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn('inline-block h-2 w-2 rounded-full', STATUS_STYLES[s].dot)} />
            <span>
              {STATUS_STYLES[s].label}
              <span className="ml-1 tabular-nums text-gray-400">· {summary[s]}</span>
            </span>
          </div>
        ))}
      </div>

      {rangeSelectActive ? (
        <p className="text-xs text-[#003580]">
          {rangeAnchor
            ? 'Click an end date to complete your selection.'
            : 'Click a start date, then an end date.'}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Month grids */}
      <div
        className={cn(
          'grid gap-4',
          monthsVisible === 2 ? 'lg:grid-cols-2' : 'grid-cols-1',
          loading && 'opacity-60'
        )}
        aria-busy={loading}
      >
        {monthOffsets.map((offset) => {
          const m = cursor.month + offset
          const year = cursor.year + Math.floor(m / 12)
          const month = ((m % 12) + 12) % 12
          return (
            <MonthGrid
              key={`${year}-${month}`}
              year={year}
              month={month}
              byDate={byDate}
              currency={currency}
              today={today}
              selectedDates={selectedDates}
              rangeAnchor={rangeAnchor}
              onDayClick={handleDayClick}
              loading={loading && !data}
            />
          )
        })}
      </div>

      {/* Bulk action bar */}
      {selectedDates.size > 0 ? (
        <div className="sticky bottom-4 z-20 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {selectedDates.size} date{selectedDates.size === 1 ? '' : 's'} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={() => setBulkOpen(true)}>
              Edit selected…
            </Button>
          </div>
        </div>
      ) : null}

      {bulkOpen ? (
        <BulkEditDialog
          gymId={gymId}
          dates={Array.from(selectedDates).sort()}
          currency={currency}
          defaultCapacity={defaultCapacity}
          defaultPrice={defaultPrice}
          onClose={() => setBulkOpen(false)}
          onSaved={async () => {
            setBulkOpen(false)
            clearSelection()
            await loadRange()
          }}
        />
      ) : null}

      {detailDay && detailDate ? (
        <DayDetailDialog
          date={detailDate}
          day={detailDay}
          currency={currency}
          gymId={gymId}
          onClose={() => setDetailDate(null)}
          onEdit={() => {
            setEditDate(detailDate)
            setDetailDate(null)
          }}
        />
      ) : null}

      {editing ? (
        <EditDayDialog
          gymId={gymId}
          day={editing}
          currency={currency}
          defaultCapacity={defaultCapacity}
          defaultPrice={defaultPrice}
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

function MonthGrid({
  year,
  month,
  byDate,
  currency,
  today,
  selectedDates,
  rangeAnchor,
  onDayClick,
  loading,
}: {
  year: number
  month: number
  byDate: Map<string, GymDayAvailability>
  currency: string
  today: string
  selectedDates: Set<string>
  rangeAnchor: string | null
  onDayClick: (iso: string) => void
  loading: boolean
}) {
  const firstDow = (() => {
    const d = new Date(Date.UTC(year, month, 1)).getUTCDay()
    return (d + 6) % 7
  })()
  const numDays = daysInMonth(year, month)
  const cells: Array<{ iso: string | null; day: number | null }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ iso: null, day: null })
  for (let d = 1; d <= numDays; d++) {
    cells.push({ iso: toIso(year, month, d), day: d })
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null })

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="mb-3 text-sm font-semibold text-gray-900">{monthLabel(year, month)}</p>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {loading ? (
          <div className="col-span-7 flex items-center justify-center py-16 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
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
                isSelected={selectedDates.has(cell.iso)}
                isAnchor={cell.iso === rangeAnchor}
                onClick={() => onDayClick(cell.iso!)}
              />
            ) : (
              <div key={`blank-${idx}`} className="h-[5.5rem] sm:h-28" aria-hidden />
            )
          )
        )}
      </div>
    </div>
  )
}

function DayCell({
  day,
  iso,
  dayNum,
  currency,
  isToday,
  isSelected,
  isAnchor,
  onClick,
}: {
  day: GymDayAvailability | undefined
  iso: string
  dayNum: number
  currency: string
  isToday: boolean
  isSelected: boolean
  isAnchor: boolean
  onClick: () => void
}) {
  const status: DayStatus = day?.status ?? 'unconfigured'
  const styles = STATUS_STYLES[status]
  const reservations = day?.reservations ?? []
  const firstGuest = reservations[0]?.guest_name?.trim() || null
  const extraCount = reservations.length > 1 ? reservations.length - 1 : 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex h-[5.5rem] flex-col justify-between rounded-xl border p-1.5 text-left text-xs transition sm:h-28 sm:p-2',
        'shadow-[0_1px_0_rgba(15,23,42,0.04)]',
        'hover:-translate-y-px hover:shadow-md hover:ring-2',
        styles.ring,
        styles.bg,
        isSelected || isAnchor
          ? 'border-[#003580] ring-2 ring-[#003580]/30'
          : 'border-gray-200/70'
      )}
      aria-label={`${iso}: ${styles.label}`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <span
            className={cn(
              'inline-flex h-1.5 w-1.5 shrink-0 rounded-full ring-1 ring-white sm:h-2 sm:w-2 sm:ring-2',
              styles.dot
            )}
            aria-hidden
          />
          <span
            className={cn(
              'tabular-nums text-xs font-semibold sm:text-sm',
              isToday ? 'text-[#003580]' : 'text-gray-900'
            )}
          >
            {dayNum}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {day?.note ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-violet-500"
              title={day.note}
              aria-label="Has note"
            />
          ) : null}
          {day?.is_closed ? (
            <Lock className="h-3 w-3 text-gray-500" aria-label="Closed" />
          ) : null}
          {day?.import_blocked ? (
            <span
              className="rounded bg-indigo-100 px-0.5 text-[8px] font-semibold text-indigo-700"
              title="Blocked by imported calendar"
            >
              Ext
            </span>
          ) : null}
        </div>
      </div>

      {day ? (
        <div className="min-w-0 space-y-0.5">
          <span className="block truncate text-[10px] font-semibold text-gray-900 sm:text-[11px]">
            {formatDashboardMoneyCompact(day.price, currency)}
          </span>
          <span className="block truncate text-[9px] text-gray-600 sm:text-[10px]">
            {day.is_closed
              ? 'Closed'
              : day.import_blocked
                ? 'Imported block'
                : day.capacity == null
                  ? `${day.booked} booked`
                  : `${day.booked}/${day.capacity} spots`}
          </span>
          {(day.closed_to_arrival || day.closed_to_departure) && !day.is_closed ? (
            <span className="block truncate text-[9px] font-medium text-amber-800">
              {day.closed_to_arrival && day.closed_to_departure
                ? 'No in / out'
                : day.closed_to_arrival
                  ? 'No arrivals'
                  : 'No departures'}
            </span>
          ) : null}
          {firstGuest ? (
            <span className="block truncate rounded bg-white/80 px-1 py-0.5 text-[9px] font-medium text-gray-800 ring-1 ring-gray-200/80">
              {day.reservations[0].is_arrival ? '→ ' : ''}
              {firstGuest}
              {extraCount > 0 ? ` +${extraCount}` : ''}
            </span>
          ) : day.min_stay_override || day.max_stay_override ? (
            <span className="text-[9px] text-amber-700">
              {day.min_stay_override ? `Min ${day.min_stay_override}n` : ''}
              {day.min_stay_override && day.max_stay_override ? ' · ' : ''}
              {day.max_stay_override ? `Max ${day.max_stay_override}n` : ''}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="text-[10px] text-gray-400">—</div>
      )}
    </button>
  )
}

function DayDetailDialog({
  date,
  day,
  currency,
  gymId,
  onClose,
  onEdit,
}: {
  date: string
  day: GymDayAvailability
  currency: string
  gymId: string
  onClose: () => void
  onEdit: () => void
}) {
  const prettyDate = useMemo(() => {
    const { y, m, d } = parseIso(date)
    return new Date(Date.UTC(y, m, d)).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }, [date])

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(520px,calc(100vw-2rem))] p-0">
        <DialogHeader className="border-b border-gray-100 p-5">
          <DialogTitle className="text-base font-semibold">{prettyDate}</DialogTitle>
          <p className="mt-1 text-xs text-gray-500">
            {formatDashboardMoneyCompact(day.price, currency)} ·{' '}
            {day.is_closed
              ? 'Closed'
              : day.capacity == null
                ? `${day.booked} booked`
                : `${day.spots_left ?? 0} of ${day.capacity} spots left`}
          </p>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto p-5">
          {day.note ? (
            <p className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-900">{day.note}</p>
          ) : null}

          {(day.closed_to_arrival ||
            day.closed_to_departure ||
            day.min_stay_override ||
            day.max_stay_override ||
            day.import_blocked) && (
            <ul className="flex flex-wrap gap-1.5 text-xs">
              {day.import_blocked ? (
                <li className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-800">
                  Imported block
                </li>
              ) : null}
              {day.closed_to_arrival ? (
                <li className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                  Closed to arrival
                </li>
              ) : null}
              {day.closed_to_departure ? (
                <li className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                  Closed to departure
                </li>
              ) : null}
              {day.min_stay_override ? (
                <li className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-800">
                  Min {day.min_stay_override} nights
                </li>
              ) : null}
              {day.max_stay_override ? (
                <li className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-800">
                  Max {day.max_stay_override} nights
                </li>
              ) : null}
            </ul>
          )}

          {day.reservations.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Bookings
              </h3>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {day.reservations.map((r) => (
                  <ReservationRow key={r.id} reservation={r} gymId={gymId} />
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No bookings on this date.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={onEdit}>
            Edit availability
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReservationRow({
  reservation,
  gymId,
}: {
  reservation: CalendarReservationChip
  gymId: string
}) {
  const label = reservation.guest_name?.trim() || 'Guest'
  const badges: string[] = []
  if (reservation.is_arrival) badges.push('Arrival')
  if (reservation.is_departure) badges.push('Departure')

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">
          {reservation.start_date} → {reservation.end_date}
          {badges.length ? ` · ${badges.join(', ')}` : ''}
        </p>
      </div>
      <Link
        href={`/manage/bookings?gym_id=${encodeURIComponent(gymId)}`}
        className="shrink-0 text-xs font-medium text-[#003580] hover:underline"
      >
        View
      </Link>
    </li>
  )
}

function BulkEditDialog({
  gymId,
  dates,
  currency,
  defaultCapacity,
  defaultPrice,
  onClose,
  onSaved,
}: {
  gymId: string
  dates: string[]
  currency: string
  defaultCapacity: number | null
  defaultPrice: number
  onClose: () => void
  onSaved: () => Promise<void> | void
}) {
  const [price, setPrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [isClosed, setIsClosed] = useState<boolean | null>(null)
  const [closedToArrival, setClosedToArrival] = useState<boolean | null>(null)
  const [closedToDeparture, setClosedToDeparture] = useState<boolean | null>(null)
  const [minStay, setMinStay] = useState('')
  const [maxStay, setMaxStay] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const submit = async () => {
    setLocalError(null)
    const body: Record<string, unknown> = { gym_id: gymId, dates }

    if (price.trim() !== '') {
      const n = Number(price)
      if (!Number.isFinite(n) || n < 0) {
        setLocalError('Invalid price')
        return
      }
      body.price_override = n
    }
    if (capacity.trim() !== '') {
      const n = Number(capacity)
      if (!Number.isFinite(n) || n < 0) {
        setLocalError('Invalid capacity')
        return
      }
      body.capacity_override = n
    }
    if (isClosed !== null) body.is_closed = isClosed
    if (closedToArrival !== null) body.closed_to_arrival = closedToArrival
    if (closedToDeparture !== null) body.closed_to_departure = closedToDeparture
    if (minStay.trim() !== '') {
      const n = Number(minStay)
      if (!Number.isInteger(n) || n < 1) {
        setLocalError('Min stay must be at least 1')
        return
      }
      body.min_stay_override = n
    }
    if (maxStay.trim() !== '') {
      const n = Number(maxStay)
      if (!Number.isInteger(n) || n < 1) {
        setLocalError('Max stay must be at least 1')
        return
      }
      body.max_stay_override = n
    }
    if (note.trim() !== '') body.note = note.trim()

    const hasField =
      body.price_override !== undefined ||
      body.capacity_override !== undefined ||
      body.is_closed !== undefined ||
      body.closed_to_arrival !== undefined ||
      body.closed_to_departure !== undefined ||
      body.min_stay_override !== undefined ||
      body.max_stay_override !== undefined ||
      body.note !== undefined

    if (!hasField) {
      setLocalError('Set at least one field to update')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/manage/calendar/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save')
      await onSaved()
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const clearAll = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/manage/calendar/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gym_id: gymId, dates, clear: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to clear')
      await onSaved()
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Failed to clear')
    } finally {
      setSaving(false)
    }
  }

  const spanLabel =
    dates.length === 1
      ? dates[0]
      : `${dates[0]} – ${dates[dates.length - 1]} (${dates.length} days)`

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[min(480px,calc(100vw-2rem))] p-0">
        <DialogHeader className="border-b border-gray-100 p-5">
          <DialogTitle className="text-base font-semibold">Edit {spanLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={isClosed === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsClosed(true)}
            >
              Block dates
            </Button>
            <Button
              type="button"
              variant={isClosed === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsClosed(false)}
            >
              Open dates
            </Button>
            <Button
              type="button"
              variant={closedToArrival === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setClosedToArrival((v) => (v === true ? null : true))}
            >
              No arrivals
            </Button>
            <Button
              type="button"
              variant={closedToDeparture === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setClosedToDeparture((v) => (v === true ? null : true))}
            >
              No departures
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Price ({currency})</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder={String(defaultPrice)}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Spots</Label>
              <Input
                type="number"
                min={0}
                placeholder={defaultCapacity == null ? 'Unlimited' : String(defaultCapacity)}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Min stay (nights)</Label>
              <Input
                type="number"
                min={1}
                value={minStay}
                onChange={(e) => setMinStay(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Max stay (nights)</Label>
              <Input
                type="number"
                min={1}
                value={maxStay}
                onChange={(e) => setMaxStay(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600">Internal note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" />
          </div>

          {localError ? (
            <p className="text-sm text-red-600">{localError}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={() => void clearAll()}
            disabled={saving}
            className="text-xs text-gray-500 underline-offset-2 hover:underline disabled:opacity-50"
          >
            Reset to defaults
          </button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={saving}>
              {saving ? 'Saving…' : 'Apply to all'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
  day: GymDayAvailability
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
  const [closedToArrival, setClosedToArrival] = useState<boolean>(day.closed_to_arrival)
  const [closedToDeparture, setClosedToDeparture] = useState<boolean>(day.closed_to_departure)
  const [minStay, setMinStay] = useState<string>(
    day.min_stay_override == null ? '' : String(day.min_stay_override)
  )
  const [maxStay, setMaxStay] = useState<string>(
    day.max_stay_override == null ? '' : String(day.max_stay_override)
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
    const maxStayNum = maxStay.trim() === '' ? null : Number(maxStay)

    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      setLocalError('Price must be a positive number')
      return
    }
    if (capNum != null && (!Number.isFinite(capNum) || capNum < 0 || capNum > 10_000)) {
      setLocalError('Capacity must be between 0 and 10,000')
      return
    }
    if (capNum != null && capNum < day.booked) {
      setLocalError(`Capacity can't be lower than current bookings (${day.booked})`)
      return
    }
    if (minStayNum != null && (!Number.isInteger(minStayNum) || minStayNum < 1)) {
      setLocalError('Minimum stay must be at least 1 night')
      return
    }
    if (maxStayNum != null && (!Number.isInteger(maxStayNum) || maxStayNum < 1)) {
      setLocalError('Maximum stay must be at least 1 night')
      return
    }
    if (minStayNum != null && maxStayNum != null && maxStayNum < minStayNum) {
      setLocalError('Max stay must be at least the min stay')
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
          closed_to_arrival: closedToArrival,
          closed_to_departure: closedToDeparture,
          min_stay_override: minStayNum,
          max_stay_override: maxStayNum,
          note: note.trim() === '' ? null : note.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save')
      await onSaved()
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Failed to save')
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
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Failed to clear')
    } finally {
      setSaving(false)
    }
  }

  const hasAnyOverride =
    day.price_override != null ||
    day.capacity_override != null ||
    day.is_closed ||
    day.closed_to_arrival ||
    day.closed_to_departure ||
    day.min_stay_override != null ||
    day.max_stay_override != null ||
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
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="flex items-center gap-2">
              {isClosed ? (
                <Lock className="h-4 w-4 text-gray-700" />
              ) : (
                <Unlock className="h-4 w-4 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Close this date</p>
                <p className="text-xs text-gray-500">Blocks new guest bookings.</p>
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
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                  isClosed ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          {day.import_blocked ? (
            <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
              This date is blocked by an imported external calendar. Remove or edit the import feed
              to change it.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Closed to arrival</p>
                <p className="text-xs text-gray-500">Guests cannot check in.</p>
              </div>
              <button
                type="button"
                onClick={() => setClosedToArrival((v) => !v)}
                disabled={day.import_blocked}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
                  closedToArrival ? 'bg-amber-600' : 'bg-gray-300'
                )}
                aria-pressed={closedToArrival}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                    closedToArrival ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Closed to departure</p>
                <p className="text-xs text-gray-500">Guests cannot check out.</p>
              </div>
              <button
                type="button"
                onClick={() => setClosedToDeparture((v) => !v)}
                disabled={day.import_blocked}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
                  closedToDeparture ? 'bg-amber-600' : 'bg-gray-300'
                )}
                aria-pressed={closedToDeparture}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                    closedToDeparture ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
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
                placeholder={String(defaultPrice)}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1"
              />
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
                placeholder={defaultCapacity == null ? 'Unlimited' : String(defaultCapacity)}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min-stay" className="text-xs font-medium text-gray-600">
                Minimum stay (nights)
              </Label>
              <Input
                id="min-stay"
                type="number"
                min={1}
                placeholder="None"
                value={minStay}
                onChange={(e) => setMinStay(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-stay" className="text-xs font-medium text-gray-600">
                Maximum stay (nights)
              </Label>
              <Input
                id="max-stay"
                type="number"
                min={1}
                placeholder="None"
                value={maxStay}
                onChange={(e) => setMaxStay(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="note" className="text-xs font-medium text-gray-600">
              Internal note
            </Label>
            <Input
              id="note"
              type="text"
              maxLength={200}
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
              onClick={() => void clearOverride()}
              disabled={saving}
              className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Reset to defaults
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
