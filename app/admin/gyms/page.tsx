'use client'

/**
 * Admin → All gyms.
 *
 * Auth guard is provided by `app/admin/layout.tsx`.
 *
 * Beyond browsing/editing, this page is also where the admin marks gyms as
 * "pre-listed" — meaning they were created on behalf of a real owner and are
 * ready to be handed over via a single-use claim link. Pre-listed gyms then
 * surface in `/admin/orphan-gyms` for the actual link issuance.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Sparkles, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import type { Gym, GymImage } from '@/lib/types/database'

interface GymWithImage extends Gym {
  images: GymImage[]
}

export default function AdminGymsPage() {
  const { user } = useAuth()
  const [gyms, setGyms] = useState<GymWithImage[]>([])
  const [loading, setLoading] = useState(true)
  const [adminOwnerIds, setAdminOwnerIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pre_listed' | 'admin_only'>('all')

  const fetchGyms = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [gymsRes, adminProfilesRes] = await Promise.all([
      supabase
        .from('gyms')
        .select(`*, images:gym_images(url, order)`)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id').eq('role', 'admin'),
    ])

    if (gymsRes.error) {
      console.error('Error fetching gyms:', gymsRes.error)
    } else {
      const processed = (gymsRes.data || []).map((g: any) => {
        if (g.images && Array.isArray(g.images)) {
          g.images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        }
        return g
      })
      setGyms(processed as GymWithImage[])
    }

    const ids = new Set<string>((adminProfilesRes.data ?? []).map((p) => p.id))
    setAdminOwnerIds(ids)

    setLoading(false)
  }, [])

  useEffect(() => { fetchGyms() }, [fetchGyms])

  const togglePreListed = async (gymId: string, next: boolean) => {
    setBusyId(gymId)
    try {
      const res = await fetch(`/api/admin/gyms/${gymId}/pre-listed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pre_listed: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Failed: ${data?.error || res.statusText}`)
        return
      }
      setGyms((prev) =>
        prev.map((g) => (g.id === gymId ? { ...g, is_pre_listed: next } : g)),
      )
    } finally {
      setBusyId(null)
    }
  }

  const adminOwnedGyms = useMemo(
    () => gyms.filter((g) => adminOwnerIds.has(g.owner_id)),
    [gyms, adminOwnerIds],
  )

  const adminOwnedNotPreListed = useMemo(
    () => adminOwnedGyms.filter((g) => !g.is_pre_listed),
    [adminOwnedGyms],
  )

  const markAllAdminOwned = async () => {
    const targets = adminOwnedNotPreListed
    if (targets.length === 0) return
    if (
      !confirm(
        `Mark ${targets.length} admin-owned gym(s) as pre-listed?\n\nThey'll show up in /admin/orphan-gyms ready for a claim link. You can unmark anything you want to keep before issuing links.`,
      )
    ) {
      return
    }
    setBulkBusy(true)
    let ok = 0
    let failed = 0
    try {
      for (const g of targets) {
        try {
          const res = await fetch(`/api/admin/gyms/${g.id}/pre-listed`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_pre_listed: true }),
          })
          if (res.ok) ok++
          else failed++
        } catch {
          failed++
        }
      }
      alert(`Marked: ${ok}\nFailed: ${failed}`)
      fetchGyms()
    } finally {
      setBulkBusy(false)
    }
  }

  const visible = useMemo(() => {
    if (filter === 'pre_listed') return gyms.filter((g) => g.is_pre_listed)
    if (filter === 'admin_only') return adminOwnedGyms
    return gyms
  }, [gyms, adminOwnedGyms, filter])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">All gyms</h1>
          <p className="mt-1 text-sm text-stone-600">
            Browse, edit, and mark gyms as <span className="font-medium">pre-listed</span>{' '}
            to surface them in the claim-link workflow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5 text-xs">
            {(
              [
                ['all', 'All'],
                ['admin_only', `Admin-owned (${adminOwnedGyms.length})`],
                ['pre_listed', `Pre-listed (${gyms.filter((g) => g.is_pre_listed).length})`],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  filter === v ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          {adminOwnedNotPreListed.length > 0 && (
            <Button
              onClick={markAllAdminOwned}
              disabled={bulkBusy}
              className="rounded-full bg-[#003580] text-white hover:bg-[#002a66]"
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {bulkBusy ? 'Marking…' : `Mark ${adminOwnedNotPreListed.length} as pre-listed`}
            </Button>
          )}
          <Link
            href="/admin/orphan-gyms"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            <KeyRound className="h-4 w-4" />
            Claim links
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-stone-500">
            No gyms match this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((gym) => {
            const isAdminOwned = adminOwnerIds.has(gym.owner_id)
            const isMine = user?.id === gym.owner_id
            return (
              <Card key={gym.id} className="flex flex-col overflow-hidden border border-stone-200">
                <div className="relative aspect-video bg-stone-100">
                  {gym.images?.length ? (
                    <img
                      src={gym.images[0].url}
                      alt={gym.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                      No image
                    </div>
                  )}
                  {gym.is_pre_listed && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#003580]/95 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      Pre-listed
                    </span>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg text-stone-900">{gym.name}</CardTitle>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          gym.verification_status === 'verified' || gym.verification_status === 'trusted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : gym.verification_status === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {gym.verification_status || 'draft'}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          gym.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : gym.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {gym.status}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-stone-600">
                    {gym.city}, {gym.country}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-stone-700">
                  <p>
                    <strong>Price:</strong> {gym.price_per_day} {gym.currency} / day
                  </p>
                  {gym.disciplines?.length ? (
                    <p>
                      <strong>Disciplines:</strong>{' '}
                      {gym.disciplines.slice(0, 3).join(', ')}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-stone-500">
                    {isMine
                      ? 'Owner: you'
                      : isAdminOwned
                        ? `Owner: admin (${gym.owner_id.slice(0, 8)}…)`
                        : `Owner: ${gym.owner_id.slice(0, 8)}…`}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t border-stone-100 bg-stone-50/50 pt-4">
                  <div className="flex w-full gap-2">
                    <Link href={`/manage/gym/edit?id=${gym.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-full">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/gyms/${gym.id}`} className="flex-1">
                      <Button variant="outline" className="w-full rounded-full">
                        View
                      </Button>
                    </Link>
                  </div>
                  {isAdminOwned && (
                    <Button
                      onClick={() => togglePreListed(gym.id, !gym.is_pre_listed)}
                      disabled={busyId === gym.id}
                      className={`w-full rounded-full ${
                        gym.is_pre_listed
                          ? 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                          : 'bg-[#003580] text-white hover:bg-[#002a66]'
                      }`}
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      {busyId === gym.id
                        ? 'Working…'
                        : gym.is_pre_listed
                          ? 'Unmark pre-listed'
                          : 'Mark as pre-listed'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
