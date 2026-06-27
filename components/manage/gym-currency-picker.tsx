'use client'

import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GYM_CURRENCY_OPTIONS } from '@/lib/constants/gym-currencies'
import { cn } from '@/lib/utils'

export function GymCurrencyPicker({
  id = 'currency',
  label = 'Currency',
  value,
  onChange,
  required = false,
  helperText,
  className,
  compact = false,
}: {
  id?: string
  label?: string
  value: string
  onChange: (code: string) => void
  required?: boolean
  helperText?: string
  className?: string
  /** Tighter field for inline rows (e.g. beside gym name). */
  compact?: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const filtered = GYM_CURRENCY_OPTIONS.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
  })

  const displayLabel = open
    ? search
    : compact
      ? value
      : (GYM_CURRENCY_OPTIONS.find((c) => c.code === value)?.label ?? value)

  const closeDropdown = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(false)
    setSearch('')
  }

  const scheduleClose = () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setOpen(false)
      setSearch('')
    }, 120)
  }

  const selectCurrency = (code: string) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    onChange(code)
    setSearch('')
    setOpen(false)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <div className="relative">
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-gray-400',
              compact ? 'left-2.5 h-3.5 w-3.5' : 'left-3 h-4 w-4',
            )}
          />
          <Input
            id={id}
            type="text"
            value={open ? search : displayLabel}
            onChange={(e) => {
              setSearch(e.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current)
                closeTimerRef.current = null
              }
              setOpen(true)
              setSearch('')
            }}
            onBlur={scheduleClose}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                closeDropdown()
              }
              if (e.key === 'Enter' && open && filtered.length === 1) {
                e.preventDefault()
                selectCurrency(filtered[0]!.code)
              }
            }}
            placeholder={compact ? 'Currency' : 'Search currency…'}
            className={cn(compact ? 'pl-8 pr-8 text-sm' : 'pl-10 pr-10')}
            required={required}
            autoComplete="off"
          />
          {open ? (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear currency search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {open ? (
          <>
            <button
              type="button"
              tabIndex={-1}
              className="fixed inset-0 z-10"
              aria-label="Close currency list"
              onMouseDown={(e) => e.preventDefault()}
              onClick={closeDropdown}
            />
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="max-h-60 overflow-y-auto">
                {filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectCurrency(c.code)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-blue-50 ${
                      value === c.code ? 'bg-blue-50 font-medium text-[#003580]' : 'text-gray-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                {filtered.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">No currencies found</div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
      {helperText ? <p className="text-xs text-gray-500">{helperText}</p> : null}
    </div>
  )
}
