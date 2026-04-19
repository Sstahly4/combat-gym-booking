'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  max as dateMax,
  min as dateMin,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { CalendarRange, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function toLocalDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseKey(key: string): Date | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

type Props = {
  /** Inclusive start YYYY-MM-DD or '' */
  from: string
  /** Inclusive end YYYY-MM-DD or '' */
  to: string
  onChange: (from: string, to: string) => void
  id?: string
}

const PANEL_W = 320
const PANEL_H_EST = 380

export function BookingDateRangePicker({ from, to, onChange, id }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const fromD = parseKey(from)
  const toD = parseKey(to)

  const [draftFrom, setDraftFrom] = useState<Date | null>(null)
  const [draftTo, setDraftTo] = useState<Date | null>(null)
  const [view, setView] = useState(() => startOfMonth(fromD ?? toD ?? new Date()))

  const updatePosition = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = r.left
    if (left + PANEL_W > vw - 8) left = Math.max(8, vw - PANEL_W - 8)
    if (left < 8) left = 8
    let top = r.bottom + 6
    if (top + PANEL_H_EST > vh - 8) {
      top = r.top - PANEL_H_EST - 6
    }
    if (top < 8) top = 8
    setPopoverPos({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition, view])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    setDraftFrom(fromD)
    setDraftTo(toD)
    const anchor = fromD ?? toD ?? new Date()
    setView(startOfMonth(anchor))
  }, [open, from, to, fromD, toD])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || popoverRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const minDate = new Date(new Date().getFullYear() - 6, 0, 1)
  const maxDate = new Date(new Date().getFullYear() + 2, 11, 31)

  const applyRange = useCallback(
    (a: Date | null, b: Date | null) => {
      if (!a || !b) return
      const start = isBefore(a, b) ? a : b
      const end = isBefore(a, b) ? b : a
      onChange(toLocalDayKey(start), toLocalDayKey(end))
    },
    [onChange]
  )

  const onDayClick = (day: Date) => {
    if (isBefore(day, minDate) || isAfter(day, maxDate)) return

    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(day)
      setDraftTo(null)
      return
    }

    if (isSameDay(day, draftFrom)) {
      setDraftTo(day)
      applyRange(draftFrom, day)
      setOpen(false)
      return
    }

    if (isBefore(day, draftFrom)) {
      setDraftTo(draftFrom)
      setDraftFrom(day)
      applyRange(day, draftFrom)
    } else {
      setDraftTo(day)
      applyRange(draftFrom, day)
    }
    setOpen(false)
  }

  const monthStart = startOfMonth(view)
  const monthEnd = endOfMonth(view)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const rangeStart = draftFrom && draftTo ? dateMin([draftFrom, draftTo]) : draftFrom
  const rangeEnd = draftFrom && draftTo ? dateMax([draftFrom, draftTo]) : draftFrom

  const inSelectedRange = (day: Date) => {
    if (!rangeStart) return false
    if (!draftTo && draftFrom && isSameDay(day, draftFrom)) return true
    if (!rangeEnd) return isSameDay(day, rangeStart)
    return (
      isWithinInterval(day, {
        start: rangeStart,
        end: rangeEnd,
      }) || isSameDay(day, rangeStart) || isSameDay(day, rangeEnd)
    )
  }

  const isRangeEnd = (day: Date): boolean =>
    Boolean(
      draftFrom &&
        draftTo &&
        (isSameDay(day, dateMin([draftFrom, draftTo])) ||
          isSameDay(day, dateMax([draftFrom, draftTo])))
    )

  const label =
    fromD && toD
      ? isSameDay(fromD, toD)
        ? format(fromD, 'd MMM yyyy')
        : `${format(fromD, 'd MMM yyyy')} – ${format(toD, 'd MMM yyyy')}`
      : 'Check-in date range'

  const panel = open ? (
    <div
      ref={popoverRef}
      className="fixed z-[200] w-[min(100vw-2rem,320px)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      style={{ top: popoverPos.top, left: popoverPos.left }}
      role="dialog"
      aria-label="Select date range"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          onClick={() => setView((v) => addMonths(v, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900">{format(view, 'MMMM yyyy')}</span>
        <button
          type="button"
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          onClick={() => setView((v) => addMonths(v, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-0 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const inViewMonth = isSameMonth(day, view)
          const disabled = isBefore(day, minDate) || isAfter(day, maxDate)
          const selected = inSelectedRange(day)
          const endCap = isRangeEnd(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick(day)}
              className={cn(
                'relative flex h-9 items-center justify-center rounded-md text-[13px] transition-colors',
                !inViewMonth && 'text-gray-300',
                inViewMonth && !disabled && 'text-gray-900',
                disabled && 'cursor-not-allowed opacity-40',
                endCap && !disabled && 'bg-[#003580] font-semibold text-white hover:bg-[#002a66]',
                selected && !endCap && !disabled && 'bg-[#003580]/12 font-medium text-[#003580]',
                !selected && !disabled && inViewMonth && 'hover:bg-gray-100'
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
      <p className="mt-3 border-t border-gray-100 pt-2 text-[11px] font-normal leading-snug text-gray-500">
        Tap a start date, then an end date. Bookings are filtered by <strong>check-in</strong> falling in this
        range.
      </p>
    </div>
  ) : null

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={cn(
          'flex w-full items-stretch gap-1 rounded-md border border-gray-200 bg-white shadow-sm transition-colors',
          'hover:border-gray-300 focus-within:ring-2 focus-within:ring-[#003580]/25'
        )}
      >
        <button
          id={id}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm text-gray-900"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <CalendarRange className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.75} aria-hidden />
          <span className="min-w-0 truncate">{label}</span>
        </button>
        {(from || to) && (
          <button
            type="button"
            className="shrink-0 rounded-r-md px-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            onClick={() => onChange('', '')}
            aria-label="Clear date range"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  )
}
