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
import { AffiliateDeleteDialog } from '@/components/admin/affiliate-delete-dialog'
import {
  extractPayPalEmail,
  payoutRailLabel,
} from '@/lib/affiliates/payout-region'
import { tierDisplayName } from '@/lib/affiliates/program-copy'

type DetailPayload = {
  setup_pending?: boolean
  affiliate: {
    id: string
    name: string
    code: string
    email: string
    tier: string
    status: string
    referral_url: string
    payout_region: string
    payout_country: string | null
    payout_method: string
    payout_details: string
    payout_details_submitted_at?: string | null
    setup_completed_at?: string | null
    created_at: string
    commission_rate_percent: number
    payout_rail: string
    retired_code: string | null
    deleted_at: string | null
  }
  stats: {
    total_clicks: number
    total_bookings: number
    conversion_rate: number | null
    lifetime_gross_value: number
    lifetime_commission: number
    pending_commission: number
    approved_commission: number
    total_paid_out: number
    last_click_at: string | null
  }
  bookings: Array<{
    id: string
    created_at: string
    total_price: number
    affiliate_payout_aud: number
    affiliate_payout_status: string
    gym: { name: string } | null
  }>
  payouts: Array<{
    id: string
    period_start: string
    period_end: string
    affiliate_payout: number
    payment_reference: string | null
    paid_at: string | null
    payout_method: string
    payout_rail: string
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

function formatPct(n: number | null) {
  if (n === null) return '—'
  return `${n}%`
}

function affiliateDisplayName(affiliate: DetailPayload['affiliate']) {
  if (affiliate.name?.trim()) return affiliate.name.trim()
  if (affiliate.email?.trim()) return affiliate.email.trim()
  return 'Pending setup'
}

function payoutStatusLabel(status: string) {
  if (status === 'pending') return 'Pending (cancellation window)'
  if (status === 'approved') return 'Confirmed (awaiting payout)'
  if (status === 'paid') return 'Paid'
  return status || '—'
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
  const setupPending =
    data.setup_pending ?? (!affiliate.setup_completed_at || !affiliate.code)
  const displayName = affiliateDisplayName(affiliate)
  const isDeleted = Boolean(affiliate.deleted_at)
  const tierLabel = tierDisplayName(affiliate.tier === 'standard' ? 'standard' : 'founding')
  const unpaidBalance = stats.pending_commission + stats.approved_commission
  const activeReferralUrl = affiliate.code ? affiliate.referral_url : ''
  const retiredCode = affiliate.retired_code

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
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-stone-900">{displayName}</h1>
            {isDeleted && (
              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                Removed
              </span>
            )}
            {setupPending && !isDeleted && (
              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Pending setup
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {affiliate.email ? `${affiliate.email} · ` : ''}
            {tierLabel} · {affiliate.commission_rate_percent}% commission ·{' '}
            <span className="capitalize">{affiliate.status}</span>
            {affiliate.created_at ? ` · joined ${formatDate(affiliate.created_at)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isDeleted && (
            <Button variant="outline" asChild>
              <Link href={`/admin/affiliates/${id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          <AffiliateDeleteDialog
            affiliateId={id}
            affiliateName={displayName}
            referralCode={affiliate.code || retiredCode}
            unpaidBalance={unpaidBalance}
            alreadyDeleted={isDeleted}
          />
        </div>
      </header>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Referral & program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {setupPending && !isDeleted ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="font-medium text-amber-900">Waiting for partner to complete setup</p>
                <p className="mt-1 text-amber-800">
                  They still need to choose their referral code and enter payout details. The same invite
                  link works if they close the tab — until they finish or it expires.
                </p>
                <div className="mt-3">
                  <AffiliateIntakeLinkButton
                    affiliateId={id}
                    affiliateName={displayName}
                    setupPending
                  />
                </div>
              </div>
            ) : activeReferralUrl ? (
              <div>
                <p className="font-medium text-stone-800">Referral link</p>
                <div className="mt-2">
                  <CopyReferralLink url={activeReferralUrl} />
                </div>
              </div>
            ) : retiredCode ? (
              <p className="text-stone-600">
                Referral code <span className="font-mono">{retiredCode}</span> retired — link no longer
                attributes bookings.
              </p>
            ) : null}

            <dl className="grid gap-2 border-t border-stone-100 pt-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-500">Commission rate</dt>
                <dd className="mt-0.5 font-medium text-stone-900">
                  {affiliate.commission_rate_percent}% of CombatStay commission
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-500">Program tier</dt>
                <dd className="mt-0.5 font-medium text-stone-900">{tierLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-500">Join date</dt>
                <dd className="mt-0.5 text-stone-900">
                  {affiliate.created_at ? formatDate(affiliate.created_at) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-stone-500">Last click</dt>
                <dd className="mt-0.5 text-stone-900">
                  {stats.last_click_at ? formatDate(stats.last_click_at) : 'No clicks yet'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payout method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {affiliate.payout_country ? (
              <p className="text-stone-700">
                {affiliate.payout_country} ·{' '}
                <span className="font-medium">{affiliate.payout_rail}</span>
                {affiliate.payout_method ? ` (${affiliate.payout_method})` : ''}
              </p>
            ) : (
              <p className="text-stone-500">
                Country and rail are set when the affiliate completes the secure setup form.
              </p>
            )}

            {affiliate.payout_details_submitted_at ? (
              <>
                <p className="text-emerald-700">
                  Submitted securely on {formatDate(affiliate.payout_details_submitted_at)}
                </p>
                {affiliate.payout_details ? (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    {affiliate.payout_region === 'international' ||
                    affiliate.payout_method === 'paypal' ? (
                      <>
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                          PayPal email
                        </p>
                        <p className="mt-1 font-mono text-sm text-stone-900">
                          {extractPayPalEmail(affiliate.payout_details) || affiliate.payout_details}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                          Bank details
                        </p>
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-sm text-stone-900">
                          {affiliate.payout_details}
                        </pre>
                      </>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-amber-700">
                {setupPending
                  ? 'Payout details appear here once they finish the invite form.'
                  : 'Waiting for affiliate to complete the secure payout form.'}
              </p>
            )}

            {!setupPending && !isDeleted && (
              <AffiliateIntakeLinkButton
                affiliateId={id}
                affiliateName={displayName}
                payoutSubmittedAt={affiliate.payout_details_submitted_at}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total clicks', value: stats.total_clicks.toLocaleString() },
          { label: 'Attributed bookings', value: stats.total_bookings.toLocaleString() },
          { label: 'Conversion rate', value: formatPct(stats.conversion_rate) },
          { label: 'Referred booking value', value: formatAud(stats.lifetime_gross_value) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">{s.label}</p>
              <p className="mt-1 text-xl font-semibold text-stone-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Lifetime commission', value: formatAud(stats.lifetime_commission) },
          { label: 'Pending (in window)', value: formatAud(stats.pending_commission) },
          { label: 'Confirmed (awaiting payout)', value: formatAud(stats.approved_commission) },
          { label: 'Total paid out', value: formatAud(stats.total_paid_out) },
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
                <option value="approved">Confirmed</option>
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
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-stone-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Gym</th>
                    <th className="py-2 pr-3 text-right">Booking value</th>
                    <th className="py-2 pr-3 text-right">Commission</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-stone-100">
                      <td className="py-2 pr-3">{formatDate(b.created_at)}</td>
                      <td className="py-2 pr-3">{b.gym?.name || '—'}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatAud(b.total_price)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatAud(b.affiliate_payout_aud || 0)}
                      </td>
                      <td className="py-2">{payoutStatusLabel(b.affiliate_payout_status)}</td>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-stone-500">
                    <th className="py-2 pr-3">Date paid</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                    <th className="py-2 pr-3">Method</th>
                    <th className="py-2">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="py-2 pr-3">
                        {p.paid_at
                          ? formatDate(p.paid_at)
                          : `${formatDate(p.period_start)} – ${formatDate(p.period_end)}`}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums font-medium">
                        {formatAud(p.affiliate_payout)}
                      </td>
                      <td className="py-2 pr-3">{p.payout_rail || payoutRailLabel('au')}</td>
                      <td className="py-2 font-mono text-stone-600">{p.payment_reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
