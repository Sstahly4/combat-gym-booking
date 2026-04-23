'use client'

/**
 * Partner Hub notification bell.
 *
 * Lives in the manage navbar (only on /manage/* for owners). Shows an unread
 * dot, opens a dropdown with the most recent notifications, supports marking
 * a single item or all as read, and navigates to the linked entity (booking,
 * review, payout) on click.
 *
 * Polls every 60s while mounted; that's well within Supabase free-tier
 * budgets for the 10–50 active owners we have at launch and avoids a
 * realtime subscription dependency.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'

interface OwnerNotificationRow {
  id: string
  gym_id: string | null
  type:
    | 'booking_created'
    | 'booking_cancelled'
    | 'review_posted'
    | 'payout_paid'
    | 'password_policy_update'
  title: string
  body: string | null
  link_href: string | null
  metadata: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

const POLL_MS = 60_000

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

const TYPE_DOT: Record<OwnerNotificationRow['type'], string> = {
  booking_created: 'bg-emerald-500',
  booking_cancelled: 'bg-rose-500',
  review_posted: 'bg-amber-500',
  payout_paid: 'bg-[#003580]',
  password_policy_update: 'bg-rose-500',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<OwnerNotificationRow[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/manage/notifications?limit=20', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data?.notifications ?? [])
      setUnread(data?.unread_count ?? 0)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, POLL_MS)
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

  async function markAll() {
    if (unread === 0) return
    setMarking(true)
    try {
      const res = await fetch('/api/manage/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (res.ok) {
        setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })))
        setUnread(0)
      }
    } finally {
      setMarking(false)
    }
  }

  async function markOne(id: string) {
    try {
      await fetch('/api/manage/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      /* ignore */
    }
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)),
    )
    setUnread((u) => Math.max(0, u - 1))
  }

  const recent = useMemo(() => items.slice(0, 20), [items])

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white tabular-nums shadow-sm ring-2 ring-[#003580]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[110] mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900">Notifications</p>
              <p className="text-[11px] text-stone-500">
                {unread > 0 ? `${unread} unread` : 'You\u2019re all caught up.'}
              </p>
            </div>
            <button
              type="button"
              onClick={markAll}
              disabled={marking || unread === 0}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[#003580] hover:bg-[#003580]/10 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Mark all read
            </button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-stone-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              </div>
            ) : recent.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-stone-500">
                No notifications yet.
                <br />
                <span className="text-xs text-stone-400">
                  New bookings, cancellations, reviews, and payouts will appear here.
                </span>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {recent.map((n) => {
                  const dotColor = TYPE_DOT[n.type] ?? 'bg-stone-400'
                  const isRead = Boolean(n.read_at)
                  const content = (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <span
                        aria-hidden
                        className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${dotColor}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug ${
                            isRead ? 'text-stone-600' : 'font-medium text-stone-900'
                          }`}
                        >
                          {n.title}
                        </p>
                        {n.body ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{n.body}</p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-stone-400">{timeAgo(n.created_at)}</p>
                      </div>
                      {!isRead && (
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#003580]" />
                      )}
                    </div>
                  )
                  if (n.link_href) {
                    return (
                      <li key={n.id}>
                        <Link
                          href={n.link_href}
                          onClick={() => {
                            setOpen(false)
                            void markOne(n.id)
                          }}
                          className="block hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
                        >
                          {content}
                        </Link>
                      </li>
                    )
                  }
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => void markOne(n.id)}
                        className="block w-full text-left hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
                      >
                        {content}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-2 text-right">
            <Link
              href="/manage/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] font-medium text-stone-500 hover:text-stone-700"
            >
              Email preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
