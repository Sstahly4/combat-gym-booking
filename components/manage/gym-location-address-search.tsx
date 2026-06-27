'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin } from 'lucide-react'
import { ALL_GYM_COUNTRIES } from '@/lib/constants/gym-countries'
import { hasNonLatinChars, matchGymCountryName } from '@/lib/geo/nominatim-address'

const DEBOUNCE_MS = 400

export type AddressSearchResultRow = {
  display_name: string
  lat: string
  lon: string
  city: string | null
  country: string | null
}

type GymLocationAddressSearchProps = {
  /** Called when user picks a suggestion — set address, city, coords, and optionally country (matched to platform list) */
  onApply: (payload: {
    address: string
    city: string
    latitude: string
    longitude: string
    country: string | null
  }) => void
  disabled?: boolean
}

export function GymLocationAddressSearch({ onApply, disabled }: GymLocationAddressSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AddressSearchResultRow[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [cityGuidance, setCityGuidance] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([])
      setSearchError(null)
      return
    }
    setLoading(true)
    setSearchError(null)
    try {
      const res = await fetch(`/api/geo/address-search?q=${encodeURIComponent(q)}`)
      const data = (await res.json()) as { results?: AddressSearchResultRow[]; error?: string }
      if (!res.ok) {
        setResults([])
        setSearchError(data.error || 'Search failed')
        return
      }
      setResults(data.results ?? [])
    } catch {
      setResults([])
      setSearchError('Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 3) {
      setResults([])
      setSearchError(null)
      return
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query.trim())
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (row: AddressSearchResultRow) => {
    const city = row.city?.trim()
    if (!city) {
      setSearchError('This result has no city in the map data — try another suggestion.')
      return
    }
    const matched = row.country ? matchGymCountryName(row.country, ALL_GYM_COUNTRIES) : null

    if (hasNonLatinChars(city)) {
      // OSM returned a local-script city name despite accept-language: en.
      // Pass an empty city so the owner is forced to type the English name.
      onApply({
        address: row.display_name,
        city: '',
        latitude: row.lat,
        longitude: row.lon,
        country: matched,
      })
      setQuery('')
      setResults([])
      setOpen(false)
      setSearchError(null)
      setCityGuidance(
        "We couldn't find an English city name for this location. Please enter the city name using the English or Latin spelling — e.g. \"Koh Phangan\", \"Tokyo\", \"Bangkok\"."
      )
      return
    }

    onApply({
      address: row.display_name,
      city,
      latitude: row.lat,
      longitude: row.lon,
      country: matched,
    })
    setQuery('')
    setResults([])
    setOpen(false)
    setSearchError(null)
    setCityGuidance(null)
  }

  return (
    <div ref={wrapRef} className="relative space-y-2">
      <Label htmlFor="gym-address-search">Search for your address</Label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          id="gym-address-search"
          type="text"
          className="pl-9"
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Street, neighbourhood, or place name"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        ) : null}
      </div>
      {searchError ? <p className="text-xs text-red-600">{searchError}</p> : null}
      {cityGuidance && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          {cityGuidance}
        </p>
      )}
      {open && results.length > 0 && (
        <ul
          className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {results.map((row) => (
            <li key={`${row.lat}-${row.lon}-${row.display_name.slice(0, 48)}`}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-800 border-b border-gray-100 last:border-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(row)}
              >
                {row.display_name}
                {!row.city && <span className="block text-xs text-amber-700 mt-0.5">No city — may not apply</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
