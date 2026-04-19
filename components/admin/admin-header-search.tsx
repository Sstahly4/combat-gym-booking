'use client'

/**
 * Admin header search — visual twin of `ManageHeaderSearch`, but scoped to
 * admin surfaces:
 *   - Static admin pages (overview, verification, gyms, claim links, reviews,
 *     offers).
 *   - Live gyms (any owner) by name / city / country.
 *
 * Renders only when the navbar is in the Admin Hub shell (`/admin/*` and
 * `profile.role === 'admin'`). The Navbar takes care of mounting/unmounting,
 * we just bail safely if the gating ever drifts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'

interface Hit {
  id: string
  title: string
  subtitle: string
  href: string
  keywords: string[]
}

const STATIC_HITS: Hit[] = [
  { id: 'admin-overview', title: 'Overview', subtitle: 'Admin · home', href: '/admin', keywords: ['home', 'overview', 'dashboard'] },
  { id: 'admin-verification', title: 'Verification queue', subtitle: 'Admin · verify gyms', href: '/admin/verification', keywords: ['verify', 'verification', 'draft', 'queue'] },
  { id: 'admin-gyms', title: 'All gyms', subtitle: 'Admin · browse + pre-list', href: '/admin/gyms', keywords: ['gyms', 'browse', 'pre-listed', 'pre-list'] },
  { id: 'admin-claim', title: 'Claim links', subtitle: 'Admin · owner handoff', href: '/admin/orphan-gyms', keywords: ['claim', 'links', 'orphan', 'handoff', 'placeholder'] },
  { id: 'admin-reviews', title: 'Reviews', subtitle: 'Admin · manual reviews', href: '/admin/reviews', keywords: ['reviews', 'manual', 'backfill'] },
  { id: 'admin-offers', title: 'Offers', subtitle: 'Admin · homepage promos', href: '/admin/offers', keywords: ['offers', 'promotions', 'promos', 'homepage'] },
]

function score(hit: Hit, q: string): number {
  if (!q) return 0
  const needle = q.toLowerCase()
  let s = 0
  if (hit.title.toLowerCase().includes(needle)) s += 4
  if (hit.subtitle.toLowerCase().includes(needle)) s += 2
  for (const k of hit.keywords) if (k.toLowerCase().includes(needle)) s += 2
  return s
}

export function AdminHeaderSearch() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, profile } = useAuth()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [gymHits, setGymHits] = useState<Hit[]>([])
  const [highlight, setHighlight] = useState(0)

  const refreshGyms = useCallback(async () => {
    if (!user?.id || profile?.role !== 'admin') return
    const supabase = createClient()
    const { data } = await supabase
      .from('gyms')
      .select('id, name, city, country')
      .order('created_at', { ascending: false })
      .limit(80)
    setGymHits(
      (data ?? []).map((g) => ({
        id: `gym-${g.id}`,
        title: g.name || 'Untitled gym',
        subtitle: [g.city, g.country].filter(Boolean).join(', ') || 'Gym',
        href: `/manage/gym/edit?id=${g.id}`,
        keywords: [g.name, g.city, g.country].filter(Boolean) as string[],
      })),
    )
  }, [user?.id, profile?.role])

  useEffect(() => {
    if (!user?.id || profile?.role !== 'admin') return
    void refreshGyms()
  }, [user?.id, profile?.role, refreshGyms, pathname])

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const allHits = useMemo(() => [...STATIC_HITS, ...gymHits], [gymHits])

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return STATIC_HITS.slice(0, 6)
    return [...allHits]
      .map((h) => ({ h, s: score(h, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((x) => x.h)
  }, [query, allHits])

  if (!pathname.startsWith('/admin') || profile?.role !== 'admin') {
    return null
  }

  const goHighlighted = () => {
    const hit = results[highlight]
    if (!hit) return
    setOpen(false)
    setQuery('')
    router.push(hit.href)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setOpen(true)
      setHighlight((i) => Math.min(i + 1, Math.max(0, results.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setOpen(true)
      setHighlight((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (!open || results.length === 0) return
      e.preventDefault()
      goHighlighted()
    }
  }

  const listId = 'admin-header-search-results'

  return (
    <div ref={rootRef} className="relative w-[11.25rem] shrink-0 sm:w-[12.75rem]">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors',
          open
            ? 'border-white/40 bg-white/15 ring-2 ring-white/25'
            : 'border-white/20 bg-white/10 hover:border-white/30 hover:bg-white/[0.12]',
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-white/70" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          id="admin-header-search"
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Search admin…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/50 outline-none"
        />
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Admin search results"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-[120] max-h-[min(70vh,22rem)] w-[min(22rem,calc(100vw-2rem))] overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-2xl shadow-gray-900/20 ring-1 ring-black/[0.04]"
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-500">
              No matches. Try a gym name, city, or "claim links".
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {results.map((hit, idx) => {
                const active = idx === highlight
                return (
                  <li key={hit.id} className="m-0 p-0">
                    <Link
                      href={hit.href}
                      role="option"
                      aria-selected={active}
                      className={cn(
                        'block px-3 py-2.5 text-left transition-colors',
                        active ? 'bg-[#003580]/8' : 'hover:bg-gray-50',
                      )}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => { setOpen(false); setQuery('') }}
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
