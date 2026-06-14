'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, RefreshCw } from 'lucide-react'

type AffiliateRow = {
  id: string
  name: string
  code: string
  tier: string
  status: string
  setup_pending?: boolean
  payout_region?: string
  payout_country?: string | null
  referral_url: string
  total_earnings: number
  pending_balance: number
  last_booking_at: string | null
  deleted_at?: string | null
  retired_code?: string | null
  email?: string
}

function rowDisplayName(row: AffiliateRow) {
  if (row.name?.trim()) return row.name.trim()
  if (row.email?.trim()) return row.email.trim()
  return 'Pending setup'
}

function formatAud(n: number) {
  return `$${n.toFixed(2)} AUD`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function pendingBadge() {
  return (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      Pending setup
    </span>
  )
}

function statusBadge(status: string, deleted?: boolean) {
  if (deleted) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        Removed
      </span>
    )
  }
  const styles =
    status === 'active'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'paused'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-stone-100 text-stone-600'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  )
}

export default function AdminAffiliatesPage() {
  const [rows, setRows] = useState<AffiliateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/affiliates', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setRows(data.affiliates || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleStatus(row: AffiliateRow) {
    const next = row.status === 'active' ? 'paused' : 'active'
    const res = await fetch(`/api/admin/affiliates/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) load(true)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">Affiliates</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Pick a tier, generate an invite link, send it. Partners complete their own setup — name,
            email, referral code, and payout details. Payouts run monthly from the{' '}
            <Link href="/admin/affiliates/payouts" className="text-[#003580] underline">
              payout report
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/affiliates/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Invite affiliate
            </Link>
          </Button>
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-stone-500">Loading affiliates…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">
              No affiliates yet.{' '}
              <Link href="/admin/affiliates/new" className="text-[#003580] underline">
                Add your first founding partner
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Rail</th>
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Total earned</th>
                    <th className="px-4 py-3 font-medium text-right">Pending</th>
                    <th className="px-4 py-3 font-medium">Last booking</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const deleted = Boolean(row.deleted_at)
                    const displayName = rowDisplayName(row)
                    return (
                    <tr key={row.id} className="border-b border-stone-100 hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-medium text-stone-900">
                        <Link href={`/admin/affiliates/${row.id}`} className="hover:underline">
                          {displayName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-stone-700">
                        {row.code || row.retired_code || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{row.payout_country || '—'}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {row.payout_country
                          ? row.payout_region === 'international'
                            ? 'PayPal'
                            : 'Bank'
                          : '—'}
                      </td>
                      <td className="px-4 py-3 capitalize text-stone-600">{row.tier}</td>
                      <td className="px-4 py-3">
                        {row.setup_pending && !deleted
                          ? pendingBadge()
                          : statusBadge(row.status, deleted)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatAud(row.total_earnings)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatAud(row.pending_balance)}</td>
                      <td className="px-4 py-3 text-stone-600">{formatDate(row.last_booking_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/affiliates/${row.id}`}>View</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/affiliates/${row.id}/edit`}>Edit</Link>
                          </Button>
                          {!deleted && (
                            <Button variant="ghost" size="sm" onClick={() => toggleStatus(row)}>
                              {row.status === 'active' ? 'Pause' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
