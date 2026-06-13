'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CopyReferralLink } from '@/components/admin/copy-referral-link'
import { AffiliateIntakeLinkButton } from '@/components/admin/affiliate-intake-link-button'

type DetailPayload = {
  affiliate: {
    id: string
    name: string
    code: string
    email: string
    tier: string
    status: string
    referral_url: string
    payout_method: string
    payout_details: string
    payout_details_submitted_at?: string | null
  }
  stats: {
    total_clicks: number
    total_bookings: number
    total_paid_out: number
    pending_balance: number
  }
  bookings: Array<{
    id: string
    created_at: string
    total_price: number
    platform_fee: number
    affiliate_payout_aud: number
    affiliate_payout_status: string
    booking_reference: string | null
    gym: { name: string } | null
    package: { name: string } | null
  }>
  payouts: Array<{
    id: string
    period_start: string
    period_end: string
    affiliate_payout: number
    payment_reference: string | null
    paid_at: string | null
  }>
}

function formatAud(n: number) {
  return `$${Number(n).toFixed(2)} AUD`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminAffiliateDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<DetailPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (statusFilter) qs.set('status', statusFilter)
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const res = await fetch(`/api/admin/affiliates/${id}/detail?${qs}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id, statusFilter, from, to])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-stone-500">Loading…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-red-600">{error || 'Not found'}</p>
      </main>
    )
  }

  const { affiliate, stats, bookings, payouts } = data

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/admin/affiliates"
        className="mb-4 inline-flex items-center text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        All affiliates
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">{affiliate.name}</h1>
          <p className="mt-1 text-sm text-stone-600">
            {affiliate.email} · <span className="capitalize">{affiliate.tier}</span> ·{' '}
            <span className="capitalize">{affiliate.status}</span>
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/affiliates/${id}/edit`}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </header>

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm font-medium text-stone-800">Referral link</p>
            <div className="mt-2">
              <CopyReferralLink url={affiliate.referral_url} />
            </div>
          </div>
          <div className="border-t border-stone-100 pt-4">
            <p className="text-sm font-medium text-stone-800">Payout details</p>
            {affiliate.payout_details_submitted_at ? (
              <p className="mt-1 text-sm text-emerald-700">
                Submitted securely on{' '}
                {new Date(affiliate.payout_details_submitted_at).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {affiliate.payout_details ? ` · ${affiliate.payout_method}` : ''}
              </p>
            ) : (
              <p className="mt-1 text-sm text-amber-700">
                Waiting for affiliate to complete the secure payout form.
              </p>
            )}
            <div className="mt-3">
              <AffiliateIntakeLinkButton
                affiliateId={id}
                affiliateName={affiliate.name}
                payoutSubmittedAt={affiliate.payout_details_submitted_at}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total clicks', value: stats.total_clicks.toLocaleString() },
          { label: 'Attributed bookings', value: stats.total_bookings.toLocaleString() },
          { label: 'Total paid out', value: formatAud(stats.total_paid_out) },
          { label: 'Pending balance', value: formatAud(stats.pending_balance) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">{s.label}</p>
              <p className="mt-1 text-xl font-semibold text-stone-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <select
                className="mt-1 block rounded-md border border-stone-200 px-2 py-1.5 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="mt-1 h-9" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="mt-1 h-9" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          {bookings.length === 0 ? (
            <p className="text-sm text-stone-500">No attributed bookings match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-stone-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Gym</th>
                    <th className="py-2 pr-3">Package</th>
                    <th className="py-2 pr-3 text-right">Value</th>
                    <th className="py-2 pr-3 text-right">CS commission</th>
                    <th className="py-2 pr-3 text-right">Their cut</th>
                    <th className="py-2">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-stone-100">
                      <td className="py-2 pr-3">{formatDate(b.created_at)}</td>
                      <td className="py-2 pr-3">{b.gym?.name || '—'}</td>
                      <td className="py-2 pr-3">{b.package?.name || '—'}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatAud(b.total_price)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatAud(b.platform_fee)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatAud(b.affiliate_payout_aud || 0)}
                      </td>
                      <td className="py-2 capitalize">{b.affiliate_payout_status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-stone-500">No payout runs yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {payouts.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <span>
                    {formatDate(p.period_start)} – {formatDate(p.period_end)}
                  </span>
                  <span className="font-medium tabular-nums">{formatAud(p.affiliate_payout)}</span>
                  <span className="text-stone-500">
                    {p.payment_reference || '—'}
                    {p.paid_at ? ` · paid ${formatDate(p.paid_at)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
