'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { ManageDashboardSearchHit } from '@/lib/manage/manage-dashboard-search-index'
import {
  filterManageDashboardHits,
  readManageActiveGymIdFromSession,
  withGymQuery,
} from '@/lib/manage/manage-dashboard-search-index'
import { isManageGymOnboardingNavLocked } from '@/lib/manage/manage-onboarding-nav-lock'
import { cn } from '@/lib/utils'

type GymRow = { id: string; name: string }
type BookingRow = {
  id: string
  guest_name: string | null
  start_date: string
  status: string
  gym: { name: string } | null
}

export function ManageHeaderSearch() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, profile } = useAuth()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [gyms, setGyms] = useState<GymRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(0)

  const activeGymId = useMemo(() => {
    const fromSession = readManageActiveGymIdFromSession()
    if (fromSession && gyms.some((g) => g.id === fromSession)) return fromSession
    return gyms[0]?.id ?? null
  }, [gyms])

  const dynamicHits = useMemo((): ManageDashboardSearchHit[] => {
    const out: ManageDashboardSearchHit[] = []
    for (const g of gyms) {
      out.push({
        id: `gym-edit-${g.id}`,
        title: `Edit ${g.name}`,
        subtitle: 'Listing, packages & photos · Gym editor',
        href: withGymQuery('/manage/gym/edit', g.id),
        keywords: ['listing', 'packages', 'photos', g.name],
      })
      out.push({
        id: `gym-preview-${g.id}`,
        title: `Preview ${g.name}`,
        subtitle: 'Public listing preview',
        href: withGymQuery('/manage/gym/preview', g.id),
        keywords: ['preview', 'public', g.name],
      })
    }
    for (const b of bookings) {
      const guest = b.guest_name?.trim() || 'Guest'
      const gymName = b.gym?.name?.trim()
      const pending = b.status === 'pending'
      const subtitleParts = [b.start_date, gymName, pending ? 'Needs response' : 'Bookings'].filter(Boolean)
      out.push({
        id: `booking-${b.id}`,
        title: `Booking · ${guest}`,
        subtitle: subtitleParts.join(' · '),
        href: pending ? '/manage/bookings#book-needs-your-response' : '/manage/bookings',
        keywords: [guest, b.status, b.start_date, gymName ?? ''].filter(Boolean) as string[],
      })
    }
    return out
  }, [gyms, bookings])

  const results = useMemo(
    () => filterManageDashboardHits(query, dynamicHits, 12),
    [query, dynamicHits]
  )

  const refreshLive = useCallback(async () => {
    if (!user?.id || profile?.role !== 'owner') return
    setLoadError(null)
    const supabase = createClient()
    const { data: gymRows, error: gErr } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (gErr) {
      setLoadError('Could not load gyms')
      setGyms([])
      setBookings([])
      return
    }

    const g = (gymRows || []) as GymRow[]
    setGyms(g)
    const ids = g.map((x) => x.id)
    if (ids.length === 0) {
      setBookings([])
      return
    }

    const { data: bookRows, error: bErr } = await supabase
      .from('bookings')
      .select('id, guest_name, start_date, status, gym:gyms(name)')
      .in('gym_id', ids)
      .order('created_at', { ascending: false })
      .limit(12)

    if (bErr) {
      setBookings([])
    } else {
      const rows = (bookRows || []) as unknown as Array<{
        id: string
        guest_name: string | null
        start_date: string
        status: string
        gym: { name: string } | { name: string }[] | null
      }>
      setBookings(
        rows.map((r) => {
          const g = r.gym
          const gymObj = Array.isArray(g) ? g[0] ?? null : g
          return {
            id: r.id,
            guest_name: r.guest_name,
            start_date: r.start_date,
            status: r.status,
            gym: gymObj,
          }
        })
      )
    }
  }, [user?.id, profile?.role])

  useEffect(() => {
    if (!user?.id || profile?.role !== 'owner') return
    void refreshLive()
  }, [user?.id, profile?.role, refreshLive, pathname])

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return
      const el = rootRef.current
      if (el && !el.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const goHighlighted = () => {
    const hit = results[highlight]
    if (!hit) return
    const href = withGymQuery(hit.href, activeGymId)
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((i) => Math.min(i + 1, Math.max(0, results.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setHighlight((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (!open || results.length === 0) return
      e.preventDefault()
      goHighlighted()
    }
  }

  if (!pathname.startsWith('/manage') || profile?.role !== 'owner') {
    return null
  }
  if (isManageGymOnboardingNavLocked(pathname)) {
    return null
  }

  const listId = 'manage-dashboard-search-results'

  return (
    <div ref={rootRef} className="relative w-[11.25rem] shrink-0 sm:w-[12.75rem]">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors',
          open
            ? 'border-white/40 bg-white/15 ring-2 ring-white/25'
            : 'border-white/20 bg-white/10 hover:border-white/30 hover:bg-white/[0.12]'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-white/70" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          id="manage-dashboard-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Search…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/50 outline-none"
        />
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Dashboard search results"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-[120] w-[min(20rem,calc(100vw-2rem))] max-h-[min(70vh,22rem)] overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-2xl shadow-gray-900/20 ring-1 ring-black/[0.04]"
        >
          {loadError ? (
            <p className="px-3 py-2 text-xs text-red-600">{loadError}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-500">
              {query.trim()
                ? 'No matches. Try “settings”, “payouts”, or a guest name.'
                : 'Start typing to search pages, settings sections, and recent bookings.'}
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {results.map((hit, idx) => {
                const href = withGymQuery(hit.href, activeGymId)
                const active = idx === highlight
                return (
                  <li key={hit.id} className="m-0 p-0">
                    <Link
                      href={href}
                      role="option"
                      aria-selected={active}
                      className={cn(
                        'block px-3 py-2.5 text-left transition-colors',
                        active ? 'bg-[#003580]/8' : 'hover:bg-gray-50'
                      )}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => {
                        setOpen(false)
                        setQuery('')
                      }}
                    >
                      <p className="text-[13px] font-medium leading-snug text-gray-900">{hit.title}</p>
                      <p className="mt-0.5 text-[11px] font-normal leading-snug text-gray-500">{hit.subtitle}</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
