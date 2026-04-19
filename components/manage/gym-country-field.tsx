'use client'

import { useEffect, useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ALL_GYM_COUNTRIES } from '@/lib/constants/gym-countries'
import { Search, X } from 'lucide-react'

type GymCountryFieldProps = {
  id?: string
  label: string
  value: string
  onChange: (country: string) => void
  required?: boolean
  inputClassName?: string
  labelClassName?: string
}

export function GymCountryField({
  id = 'gym-country',
  label,
  value,
  onChange,
  required,
  inputClassName = 'border-gray-200 bg-white focus-visible:border-[#003580]/45 focus-visible:ring-[#003580]/20',
  labelClassName = 'text-gray-900',
}: GymCountryFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtered = search.trim()
    ? ALL_GYM_COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : ALL_GYM_COUNTRIES

  return (
    <div className="space-y-2" ref={rootRef}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <Input
            id={id}
            className={`pl-9 pr-9 ${inputClassName}`}
            value={open ? search : value}
            onChange={(e) => {
              setSearch(e.target.value)
              if (!open) setOpen(true)
            }}
            onFocus={() => {
              setOpen(true)
              setSearch(value ? '' : search)
            }}
            placeholder={value ? '' : 'Search for a country…'}
            autoComplete="off"
            aria-expanded={open}
            aria-controls={`${id}-listbox`}
            aria-autocomplete="list"
            role="combobox"
          />
          {value ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              onClick={() => {
                onChange('')
                setSearch('')
                setOpen(false)
              }}
              aria-label="Clear country"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {open && (
          <ul
            id={`${id}-listbox`}
            role="listbox"
            className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {filtered.slice(0, 80).map((country) => (
              <li key={country} role="option" aria-selected={value === country}>
                <button
                  type="button"
                  className={`flex w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    value === country ? 'bg-blue-50 font-medium text-[#003580]' : 'text-gray-800'
                  }`}
                  onClick={() => {
                    onChange(country)
                    setSearch('')
                    setOpen(false)
                  }}
                >
                  {country}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No match</li>
            ) : null}
            {filtered.length > 80 ? (
              <li className="px-3 py-1.5 text-xs text-muted-foreground">Refine search to see more.</li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  )
}
