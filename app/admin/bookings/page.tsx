'use client'

/**
 * Admin → Recent bookings across all gyms (read-only ops view).
 * Linked from the admin navbar activity bell.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ClipboardList, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Row = {
  id: string
  created_at: string
  status: string
  start_date: string
  end_date: string
  total_price: number | null
  platform_fee: number | null
  gym_id: string
  guest_name: string | null
  guest_email: string | null
  gym_name: string | null
  gym_city: string | null
  gym_country: string | null
  gym_currency: string
}

function formatMoney(n: number | null, cur: string) {
  const v = Number(n) || 0
  const code = (cur || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(v)
  } catch {
    return `${v.toFixed(2)} ${code}`
  }
}

export default function AdminBookingsPage() {
  const { profile, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('booking_id')?.trim().toLowerCase() || null
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (profile?.role !== 'admin') return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const since = new Date()
      since.setDate(since.getDate() - 90)

      const { data: bRows, error: bErr } = await supabase
        .from('bookings')
        .select(
          'id, created_at, status, start_date, end_date, total_price, platform_fee, gym_id, guest_name, guest_email',
        )
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(200)

      if (bErr) throw new Error(bErr.message)

      const raw = (bRows || []) as Omit<Row, 'gym_name' | 'gym_city' | 'gym_country' | 'gym_currency'>[]
      const gymIds = [...new Set(raw.map((r) => r.gym_id).filter(Boolean))]
      const meta = new Map<string, { name: string; city: string | null; country: string | null; currency: string }>()
      if (gymIds.length > 0) {
        const { data: gyms, error: gErr } = await supabase
          .from('gyms')
          .select('id, name, city, country, currency')
          .in('id', gymIds)
        if (gErr) throw new Error(gErr.message)
        for (const g of gyms || []) {
          meta.set(g.id as string, {
            name: (g.name as string) || '—',
            city: (g.city as string | null) ?? null,
            country: (g.country as string | null) ?? null,
            currency: (g.currency as string) || 'USD',
          })
        }
      }

      setRows(
        raw.map((r) => {
          const m = meta.get(r.gym_id)
          return {
            ...r,
            gym_name: m?.name ?? null,
            gym_city: m?.city ?? null,
            gym_country: m?.country ?? null,
            gym_currency: m?.currency || 'USD',
          }
        })
      )
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to load bookings')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [profile?.role])

  useEffect(() => {
    if (authLoading) return
    if (profile?.role !== 'admin') return
    void load()
  }, [authLoading, profile?.role, load])

  useEffect(() => {
    if (!highlightId || loading) return
    const el = rowRefs.current[highlightId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId, loading, rows])

  if (authLoading) {
    return (
      <div className="flex min-h-[40svh] items-center justify-center text-sm text-stone-500">
        Loading…
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return null
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-stone-900">
            <ClipboardList className="h-7 w-7 text-[#003580]" strokeWidth={1.75} aria-hidden />
            Bookings
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Recent bookings across all gyms (last 90 days, newest first). Use the activity bell in the header for the
          same feed with quick links.
        </p>
      </header>

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${rows.length} booking${rows.length === 1 ? '' : 's'} loaded`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-rose-800" role="alert">
              {error}
            </p>
          ) : null}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Loading bookings…
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">No bookings in this window.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-100">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Gym</th>
                    <th className="px-3 py-2">Guest</th>
                    <th className="px-3 py-2">Stay</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Fee</th>
                    <th className="px-3 py-2 font-mono text-[11px]">Booking id</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map((r) => {
                    const idLower = r.id.toLowerCase()
                    const hi = highlightId === idLower
                    return (
                      <tr
                        key={r.id}
                        ref={(el) => {
                          rowRefs.current[idLower] = el
                        }}
                        className={
                          hi
                            ? 'bg-amber-50/90 ring-2 ring-inset ring-amber-300/80'
                            : 'hover:bg-stone-50/80'
                        }
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-stone-700">
                          {new Date(r.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-stone-900">{r.gym_name || '—'}</div>
                          <div className="text-xs text-stone-500">
                            {[r.gym_city, r.gym_country].filter(Boolean).join(', ') || r.gym_id.slice(0, 8) + '…'}
                          </div>
                          <Link
                            href={`/admin/gyms?gym_id=${encodeURIComponent(r.gym_id)}`}
                            className="text-xs font-medium text-[#003580] hover:underline"
                          >
                            Open in Gyms
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-stone-800">
                          <div>{r.guest_name?.trim() || '—'}</div>
                          {r.guest_email ? (
                            <div className="text-xs text-stone-500">{r.guest_email}</div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-stone-600">
                          {r.start_date} → {r.end_date}
                        </td>
                        <td className="px-3 py-2 capitalize text-stone-700">{r.status}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-stone-900">
                          {formatMoney(r.total_price, r.gym_currency)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-stone-600">
                          {formatMoney(r.platform_fee, r.gym_currency)}
                        </td>
                        <td className="max-w-[10rem] px-3 py-2 font-mono text-[11px] text-stone-700">
                          <span className="break-all">{r.id}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <Link
              href="/admin"
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-stone-600 hover:bg-stone-100"
            >
              Admin overview
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
