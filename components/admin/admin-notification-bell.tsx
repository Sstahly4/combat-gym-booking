'use client'

/**
 * Admin Hub navbar bell — recent bookings + newly created gyms (activity feed).
 * Read state is per-browser (localStorage) so multiple admins each have their own cursor.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Building2, CalendarCheck, CheckCheck, Loader2 } from 'lucide-react'
import type { AdminActivityItem } from '@/lib/admin/admin-activity-types'

const STORAGE_KEY = 'combatstay_admin_activity_seen_v1'
const POLL_MS = 60_000
const MAX_SEEN = 400

function seenKey(item: AdminActivityItem): string {
  return `${item.kind}:${item.id}`
}

function loadSeen(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveSeen(keys: string[]) {
  if (typeof window === 'undefined') return
  const trimmed = keys.slice(-MAX_SEEN)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime()
  if (Number.isNaN(d)) return ''
  const diff = Date.now() - d
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const dys = Math.round(hr / 24)
  if (dys < 7) return `${dys}d ago`
  return new Date(iso).toLocaleDateString()
}

export function AdminNotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AdminActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [seenKeys, setSeenKeys] = useState<string[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSeenKeys(loadSeen())
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/activity-feed', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { items?: AdminActivityItem[] }
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
    const t = setInterval(() => void fetchData(), POLL_MS)
    return () => clearInterval(t)
  }, [fetchData])

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const seenSet = useMemo(() => new Set(seenKeys), [seenKeys])

  const unreadCount = useMemo(() => {
    return items.filter((it) => !seenSet.has(seenKey(it))).length
  }, [items, seenSet])

  const markSeen = useCallback((key: string) => {
    setSeenKeys((prev) => {
      if (prev.includes(key)) return prev
      const next = [...prev, key]
      saveSeen(next)
      return next
    })
  }, [])

  const markAllInFeed = useCallback(() => {
    const keys = items.map(seenKey)
    setSeenKeys((prev) => {
      const next = [...new Set([...prev, ...keys])]
      saveSeen(next)
      return next
    })
  }, [items])

  const onItemNavigate = useCallback(
    (item: AdminActivityItem) => {
      markSeen(seenKey(item))
      setOpen(false)
      router.push(item.href)
    },
    [markSeen, router]
  )

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        aria-label={unreadCount > 0 ? `${unreadCount} unread admin updates` : 'Admin activity'}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[110] mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-2 border-b border-stone-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">Admin activity</p>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Recent bookings and new gym listings (last ~3 weeks).
              </p>
            </div>
            <button
              type="button"
              onClick={() => void markAllInFeed()}
              disabled={items.length === 0 || unreadCount === 0}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark seen
            </button>
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading…
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-stone-500">No recent activity.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {items.map((it) => {
                  const k = seenKey(it)
                  const unread = !seenSet.has(k)
                  const Icon = it.kind === 'booking' ? CalendarCheck : Building2
                  return (
                    <li key={k}>
                      <button
                        type="button"
                        onClick={() => onItemNavigate(it)}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                          unread ? 'bg-[#003580]/[0.04]' : ''
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            it.kind === 'booking' ? 'bg-emerald-50 text-emerald-800' : 'bg-sky-50 text-sky-800'
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium text-stone-900">{it.title}</span>
                            {unread ? (
                              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800">
                                New
                              </span>
                            ) : null}
                          </span>
                          {it.gym_name ? (
                            <span className="mt-0.5 block truncate text-xs font-medium text-[#003580]">
                              {it.gym_name}
                            </span>
                          ) : null}
                          {it.subtitle ? (
                            <span className="mt-0.5 line-clamp-2 text-xs text-stone-600">{it.subtitle}</span>
                          ) : null}
                          <span className="mt-1 block text-[10px] text-stone-400">{timeAgo(it.created_at)}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 border-t border-stone-100 bg-stone-50/60 px-4 py-2 text-[11px]">
            <Link
              href="/admin/bookings"
              onClick={() => setOpen(false)}
              className="font-medium text-[#003580] hover:underline"
            >
              All bookings
            </Link>
            <Link href="/admin/gyms" onClick={() => setOpen(false)} className="font-medium text-[#003580] hover:underline">
              All gyms
            </Link>
            <Link href="/admin" onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-700">
              Admin Hub
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
