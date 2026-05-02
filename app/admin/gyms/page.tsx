'use client'

/**
 * Admin → All gyms.
 *
 * Auth guard is provided by `app/admin/layout.tsx`.
 *
 * Conceptually:
 *   - Every admin-owned gym is treated as "pre-listed" — admins create gyms
 *     on behalf of real owners and hand them over via claim links from
 *     `/admin/orphan-gyms`. There is no separate manual "mark as pre-listed"
 *     step in the UI; the admin owner_id IS the signal.
 *   - "Owner-owned" gyms are everything else (real partner accounts plus
 *     placeholder accounts that have been minted but not yet claimed).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { KeyRound, PlusCircle, Sparkles, Upload } from 'lucide-react'
import { ADMIN_CREATE_GYM_ONBOARDING_HREF } from '@/lib/admin/admin-routes'
import {
  restoreAdminGymsListScrollIfStashed,
  stashAdminGymsListScrollForReturn,
} from '@/lib/admin/admin-gyms-scroll-restore'
import { manageGymEditHref } from '@/lib/navigation/manage-gym-edit-return'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import type { Gym, GymImage } from '@/lib/types/database'

interface GymWithImage extends Gym {
  images: GymImage[]
}

type AdminGymsFilter = 'all' | 'pre_listed' | 'owner_owned'

export default function AdminGymsPage() {
  const { user } = useAuth()
  const [gyms, setGyms] = useState<GymWithImage[]>([])
  const [loading, setLoading] = useState(true)
  const [adminOwnerIds, setAdminOwnerIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<AdminGymsFilter>('all')

  const fetchGyms = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [gymsRes, adminProfilesRes] = await Promise.all([
      supabase
        .from('gyms')
        .select(`*, images:gym_images(url, variants, order)`)
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

  useEffect(() => {
    if (loading) return
    restoreAdminGymsListScrollIfStashed()
  }, [loading])

  const adminOwnedGyms = useMemo(
    () => gyms.filter((g) => adminOwnerIds.has(g.owner_id)),
    [gyms, adminOwnerIds],
  )

  const ownerOwnedGyms = useMemo(
    () => gyms.filter((g) => !adminOwnerIds.has(g.owner_id)),
    [gyms, adminOwnerIds],
  )

  const visible = useMemo(() => {
    if (filter === 'pre_listed') return adminOwnedGyms
    if (filter === 'owner_owned') return ownerOwnedGyms
    return gyms
  }, [gyms, adminOwnedGyms, ownerOwnedGyms, filter])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">All gyms</h1>
          <p className="mt-1 text-sm text-stone-600">
            Browse and edit listings. Admin-owned gyms are automatically{' '}
            <span className="font-medium">pre-listed</span> — issue claim links from{' '}
            <Link href="/admin/orphan-gyms" className="text-[#003580] underline-offset-2 hover:underline">
              /admin/orphan-gyms
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/gyms/bulk-import"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            <Upload className="h-4 w-4" />
            Bulk import
          </Link>
          <Link
            href={ADMIN_CREATE_GYM_ONBOARDING_HREF}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <PlusCircle className="h-4 w-4" />
            Create gym
          </Link>
          <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5 text-xs">
            {(
              [
                ['all', `All (${gyms.length})`],
                ['pre_listed', `Pre-listed (${adminOwnedGyms.length})`],
                ['owner_owned', `Owner-owned (${ownerOwnedGyms.length})`],
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
                  {isAdminOwned && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-stone-200/90 bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-stone-700 shadow-sm backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 text-stone-500" aria-hidden />
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
                      ? 'Owner: you (admin)'
                      : isAdminOwned
                        ? `Owner: admin (${gym.owner_id.slice(0, 8)}…)`
                        : `Owner: ${gym.owner_id.slice(0, 8)}…`}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t border-stone-100 bg-stone-50/50 pt-4">
                  <div className="flex w-full gap-2">
                    <Link
                      href={manageGymEditHref(gym.id, { returnTo: '/admin/gyms' })}
                      className="flex-1"
                      onClick={() => stashAdminGymsListScrollForReturn()}
                    >
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
                    <Link href="/admin/orphan-gyms" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-stone-300 text-stone-800 hover:bg-stone-100"
                      >
                        <KeyRound className="mr-1.5 h-4 w-4" />
                        Issue claim link
                      </Button>
                    </Link>
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
