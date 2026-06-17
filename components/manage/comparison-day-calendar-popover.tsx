'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
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
  startOfMonth,
  startOfWeek,
} from 'date-fns'

const BRAND = '#003580'

export function parseLocalDayKey(key: string): Date {
  const parts = key.split('-').map(Number)
  const y = parts[0]!
  const m = parts[1]!
  const d = parts[2]!
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function toLocalDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Props = {
  valueKey: string
  /** Inclusive upper bound (typically yesterday); cannot select after this day */
  maxDayKey: string
  onSelect: (key: string) => void
  className?: string
}

export function ComparisonDayCalendarPanel({ valueKey, maxDayKey, onSelect, className = '' }: Props) {
  const selected = parseLocalDayKey(valueKey)
  const maxDate = parseLocalDayKey(maxDayKey)
  const minDate = new Date(maxDate.getFullYear() - 5, 0, 1)

  const [view, setView] = useState(() => startOfMonth(selected))
  const [dd, setDd] = useState(() => String(selected.getDate()).padStart(2, '0'))
  const [mm, setMm] = useState(() => String(selected.getMonth() + 1).padStart(2, '0'))
  const [yyyy, setYyyy] = useState(() => String(selected.getFullYear()))
  const [monthYearOpen, setMonthYearOpen] = useState(false)

  useEffect(() => {
    const s = parseLocalDayKey(valueKey)
    setDd(String(s.getDate()).padStart(2, '0'))
    setMm(String(s.getMonth() + 1).padStart(2, '0'))
    setYyyy(String(s.getFullYear()))
    setView(startOfMonth(s))
    setMonthYearOpen(false)
  }, [valueKey])

  const applyTypedDate = useCallback(() => {
    const d = parseInt(dd, 10)
    const m = parseInt(mm, 10)
    const y = parseInt(yyyy, 10)
    if (!y || m < 1 || m > 12 || d < 1 || d > 31) return
    const trial = new Date(y, m - 1, d, 0, 0, 0, 0)
    if (trial.getMonth() !== m - 1 || trial.getDate() !== d) return
    let next = trial
    if (isAfter(next, maxDate)) next = maxDate
    if (isBefore(next, minDate)) next = minDate
    onSelect(toLocalDayKey(next))
  }, [dd, mm, yyyy, maxDate, minDate, onSelect])

  const monthStart = startOfMonth(view)
  const monthEnd = endOfMonth(view)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const prevMonth = () => setView((v) => addMonths(v, -1))
  const nextMonth = () => setView((v) => addMonths(v, 1))

  const years: number[] = []
  for (let y = minDate.getFullYear(); y <= maxDate.getFullYear(); y++) years.push(y)
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return (
    <div
      className={`w-[min(100%,280px)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg ${className}`}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="mb-3 flex items-center justify-center gap-1.5 rounded-md border border-sky-300/90 bg-white px-2 py-2 text-sm text-gray-900 shadow-sm">
        <input
          aria-label="Day"
          className="w-8 border-0 bg-transparent p-0 text-center outline-none focus:ring-0"
          inputMode="numeric"
          maxLength={2}
          value={dd}
          onChange={(e) => setDd(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={applyTypedDate}
          onKeyDown={(e) => e.key === 'Enter' && applyTypedDate()}
        />
        <span className="text-gray-400">/</span>
        <input
          aria-label="Month"
          className="w-8 border-0 bg-transparent p-0 text-center outline-none focus:ring-0"
          inputMode="numeric"
          maxLength={2}
          value={mm}
          onChange={(e) => setMm(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={applyTypedDate}
          onKeyDown={(e) => e.key === 'Enter' && applyTypedDate()}
        />
        <span className="text-gray-400">/</span>
        <input
          aria-label="Year"
          className="min-w-[3.25rem] flex-1 border-0 bg-transparent p-0 text-center outline-none focus:ring-0"
          inputMode="numeric"
          maxLength={4}
          value={yyyy}
          onChange={(e) => setYyyy(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={applyTypedDate}
          onKeyDown={(e) => e.key === 'Enter' && applyTypedDate()}
        />
      </div>

      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
          aria-label="Previous month"
          onClick={() => {
            setMonthYearOpen(false)
            prevMonth()
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="relative flex min-w-0 flex-1 justify-center">
          <button
            type="button"
            className="flex min-w-0 items-center justify-center gap-1 truncate rounded-md px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100"
            aria-label="Jump to month and year"
            aria-expanded={monthYearOpen}
            onClick={() => setMonthYearOpen((o) => !o)}
          >
            <span className="truncate">{format(view, 'MMMM yyyy')}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
          </button>

          {monthYearOpen ? (
            <div className="absolute top-[calc(100%+6px)] z-10 w-[260px] rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-medium text-gray-500">
                  Month
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900"
                    value={view.getMonth()}
                    onChange={(e) => setView((v) => new Date(v.getFullYear(), Number(e.target.value), 1))}
                  >
                    {months.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-medium text-gray-500">
                  Year
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900"
                    value={view.getFullYear()}
                    onChange={(e) => setView((v) => new Date(Number(e.target.value), v.getMonth(), 1))}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMonthYearOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
          aria-label="Next month"
          onClick={() => {
            setMonthYearOpen(false)
            nextMonth()
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-normal text-gray-400">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 text-center">
        {days.map((day) => {
          const inMonth = isSameMonth(day, view)
          const isSel = isSameDay(day, selected)
          const disabled = isAfter(day, maxDate) || isBefore(day, minDate)
          return (
            <button
              key={toLocalDayKey(day)}
              type="button"
              disabled={disabled}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                disabled
                  ? 'cursor-not-allowed text-gray-200'
                  : inMonth
                    ? 'text-gray-800 hover:bg-gray-100'
                    : 'text-gray-300 hover:bg-gray-50'
              } ${isSel ? 'font-medium text-white hover:bg-[#003580]' : ''}`}
              style={isSel ? { backgroundColor: BRAND } : undefined}
              onClick={() => !disabled && onSelect(toLocalDayKey(day))}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

 
