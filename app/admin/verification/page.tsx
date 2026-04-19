'use client'

/**
 * Admin verification queue.
 *
 * Auth guard is provided by `app/admin/layout.tsx`; this page assumes the
 * caller is already authorised as an admin.
 *
 * Behaviour mirrors the legacy inline queue that used to live on `/admin`:
 * - Lists `verification_status = 'draft'` gyms (modern flow).
 * - Lists `status = 'pending'` gyms (legacy approval flow) so we don't lose
 *   any historic items still sitting around.
 * - Supports per-gym verify, bulk verify-all, and approve/reject for legacy.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { GymVerificationCard } from '@/components/admin/gym-verification-card'
import type { Gym } from '@/lib/types/database'

export default function AdminVerificationPage() {
  const [draftGyms, setDraftGyms] = useState<Gym[]>([])
  const [pendingGyms, setPendingGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [verifyingGymId, setVerifyingGymId] = useState<string | null>(null)
  const [verifyingAll, setVerifyingAll] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const supabase = createClient()
      const [draftRes, pendingRes] = await Promise.all([
        supabase
          .from('gyms')
          .select('*')
          .eq('verification_status', 'draft')
          .order('created_at', { ascending: false }),
        supabase
          .from('gyms')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ])
      setDraftGyms(draftRes.data ?? [])
      setPendingGyms(pendingRes.data ?? [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleVerifyGym = async (gymId: string) => {
    setVerifyingGymId(gymId)
    try {
      const response = await fetch(`/api/gyms/${gymId}/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (!response.ok) {
        alert(`Verification failed: ${data.error || data.message || `HTTP ${response.status}`}`)
        return
      }
      if (data.success) {
        if (data.admin_override) {
          alert('Gym verified successfully (admin override applied)')
        }
        fetchData(true)
      } else {
        alert(`Verification failed: ${data.error || data.message || 'Unknown error'}`)
      }
    } catch (err: any) {
      alert(`Error verifying gym: ${err.message || 'Unknown error'}`)
    } finally {
      setVerifyingGymId(null)
    }
  }

  const handleVerifyAll = async () => {
    if (draftGyms.length === 0) return
    if (
      !confirm(
        `Verify all ${draftGyms.length} draft gyms? This bypasses all requirement checks.`,
      )
    ) {
      return
    }

    setVerifyingAll(true)
    let success = 0
    let failed = 0
    const errors: string[] = []
    try {
      for (const gym of draftGyms) {
        try {
          const res = await fetch(`/api/gyms/${gym.id}/verify`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          const data = await res.json()
          if (res.ok && data.success) success++
          else {
            failed++
            errors.push(`${gym.name}: ${data.error || data.message || 'Unknown error'}`)
          }
        } catch (err: any) {
          failed++
          errors.push(`${gym.name}: ${err.message || 'Network error'}`)
        }
      }
      if (failed === 0) alert(`Verified ${success} gym(s).`)
      else
        alert(
          `Verified: ${success}\nFailed: ${failed}\n\n${errors.slice(0, 5).join('\n')}${
            errors.length > 5 ? `\n…and ${errors.length - 5} more` : ''
          }`,
        )
      fetchData(true)
    } finally {
      setVerifyingAll(false)
    }
  }

  const handleLegacyAction = async (gymId: string, action: 'approve' | 'reject') => {
    const supabase = createClient()
    const { error } = await supabase
      .from('gyms')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', gymId)
    if (error) {
      alert(`Failed: ${error.message}`)
      return
    }
    if (action === 'approve') {
      fetch(`/api/gyms/${gymId}/fetch-landmarks`, { method: 'POST' }).catch(() => {})
    }
    fetchData(true)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Admin
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-stone-900">
            <ShieldCheck className="h-5 w-5 text-[#003580]" />
            Verification queue
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Verify gyms so they become visible and bookable. All requirements
            must be met before verification (admin override is allowed).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="rounded-full"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {draftGyms.length > 0 && (
            <Button
              onClick={handleVerifyAll}
              disabled={verifyingAll}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700"
            >
              {verifyingAll ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify all ({draftGyms.length})
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : draftGyms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 px-4 py-12 text-center text-sm text-stone-500">
          No draft gyms — everything is verified.
        </div>
      ) : (
        <div className="space-y-4">
          {draftGyms.map((gym) => (
            <GymVerificationCard
              key={gym.id}
              gym={gym}
              onVerify={handleVerifyGym}
              isVerifying={verifyingGymId === gym.id || verifyingAll}
            />
          ))}
        </div>
      )}

      {pendingGyms.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900">
            <Clock className="h-4 w-4 text-stone-500" />
            Pending approvals (legacy flow)
          </h2>
          <div className="space-y-4">
            {pendingGyms.map((gym) => (
              <div
                key={gym.id}
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <p className="text-base font-semibold text-stone-900">{gym.name}</p>
                <p className="mt-1 text-sm text-stone-600">
                  {gym.city}, {gym.country} · {gym.disciplines?.join(', ')}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {gym.price_per_day} {gym.currency} / day
                </p>
                {gym.description && (
                  <p className="mt-2 text-sm text-stone-500">
                    {gym.description.substring(0, 200)}
                    {gym.description.length > 200 ? '…' : ''}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => handleLegacyAction(gym.id, 'approve')}>
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleLegacyAction(gym.id, 'reject')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
