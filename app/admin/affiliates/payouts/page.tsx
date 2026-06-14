'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, RefreshCw } from 'lucide-react'
import { AFFILIATE_MIN_PAYOUT_AUD } from '@/lib/affiliates/constants'

type ReportRow = {
  affiliate_id: string
  affiliate_name: string
  affiliate_code: string
  payout_country: string | null
  payout_rail: string
  payout_method: string
  payout_details: string
  bookings_count: number
  gross_booking_value: number
  combatstay_commission: number
  affiliate_payout: number
  meets_minimum: boolean
}

function defaultPreviousMonth() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: fmt(start), end: fmt(end) }
}

function formatAud(n: number) {
  return `$${Number(n).toFixed(2)} AUD`
}

export default function AdminAffiliatePayoutsPage() {
  const defaults = useMemo(() => defaultPreviousMonth(), [])
  const [periodStart, setPeriodStart] = useState(defaults.start)
  const [periodEnd, setPeriodEnd] = useState(defaults.end)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [belowMinimum, setBelowMinimum] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refs, setRefs] = useState<Record<string, string>>({})
  const [payingId, setPayingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ period_start: periodStart, period_end: periodEnd })
      const res = await fetch(`/api/admin/affiliates/payout-report?${qs}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load report')
      setRows(data.payable || [])
      setBelowMinimum(data.below_minimum || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [periodStart, periodEnd])

  useEffect(() => {
    load()
  }, [load])

  async function markPaid(row: ReportRow) {
    const paymentReference = refs[row.affiliate_id]?.trim()
    if (!paymentReference) {
      alert('Enter a payment reference (bank transfer ref or PayPal transaction ID) first.')
      return
    }
    setPayingId(row.affiliate_id)
    try {
      const res = await fetch('/api/admin/affiliates/payout-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate_id: row.affiliate_id,
          period_start: periodStart,
          period_end: periodEnd,
          payment_reference: paymentReference,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to mark paid')
      await load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setPayingId(null)
    }
  }

  function exportCsv() {
    const qs = new URLSearchParams({
      period_start: periodStart,
      period_end: periodEnd,
      format: 'csv',
    })
    window.open(`/api/admin/affiliates/payout-report?${qs}`, '_blank')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">Affiliate payout report</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Review approved bookings for the selected period, process bank transfers or PayPal manually,
          then mark each affiliate as paid. Minimum payout is ${AFFILIATE_MIN_PAYOUT_AUD} AUD — balances
          below that roll forward to the next month.
        </p>
      </header>

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div>
            <Label htmlFor="period_start">Period start</Label>
            <Input
              id="period_start"
              type="date"
              className="mt-1 w-44"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="period_end">Period end</Label>
            <Input
              id="period_end"
              type="date"
              className="mt-1 w-44"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Run report
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin/affiliates">Manage affiliates</Link>
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Ready to pay</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-stone-500">Calculating…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">
              No affiliates meet the minimum for this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-stone-500">
                    <th className="px-4 py-3">Affiliate</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Rail</th>
                    <th className="px-4 py-3 text-right">Bookings</th>
                    <th className="px-4 py-3 text-right">Payout</th>
                    <th className="px-4 py-3">Payout details</th>
                    <th className="px-4 py-3">Payment reference</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.affiliate_id} className="border-b border-stone-100">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/affiliates/${row.affiliate_id}`}
                          className="font-medium hover:underline"
                        >
                          {row.affiliate_name}
                        </Link>
                        <p className="font-mono text-xs text-stone-500">{row.affiliate_code}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{row.payout_country || '—'}</td>
                      <td className="px-4 py-3 font-medium text-stone-800">{row.payout_rail}</td>
                      <td className="px-4 py-3 text-right">{row.bookings_count}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatAud(row.affiliate_payout)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">
                        {row.payout_details || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          className="h-8 min-w-[140px]"
                          placeholder="Transfer ref / PayPal ID"
                          value={refs[row.affiliate_id] || ''}
                          onChange={(e) =>
                            setRefs((prev) => ({ ...prev, [row.affiliate_id]: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          disabled={payingId === row.affiliate_id}
                          onClick={() => markPaid(row)}
                        >
                          {payingId === row.affiliate_id ? 'Saving…' : 'Mark as paid'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {belowMinimum.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-amber-900">Below minimum (rolls forward)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {belowMinimum.map((row) => (
                <li key={row.affiliate_id} className="flex justify-between gap-4">
                  <span>{row.affiliate_name}</span>
                  <span className="tabular-nums text-stone-600">
                    {formatAud(row.affiliate_payout)} — below ${AFFILIATE_MIN_PAYOUT_AUD} minimum
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
