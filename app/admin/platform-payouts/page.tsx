'use client'

/**
 * Admin → Record platform payout batches (Wise pending / immediate completed).
 * Auth: AdminLayoutShell (admin role only).
 *
 * Runbook: docs/internal/ops-platform-payouts-runbook.md
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Banknote, BookOpen, Check, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseBookingIds(raw: string): string[] {
  const parts = raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
  const out: string[] = []
  for (const p of parts) {
    if (UUID_RE.test(p)) out.push(p.toLowerCase())
  }
  return [...new Set(out)]
}

type GymRow = {
  id: string
  name: string
  city: string | null
  country: string | null
  payout_rail: string | null
  currency: string | null
  wise_recipient_email: string | null
  wise_recipient_account_holder_name: string | null
  wise_recipient_currency: string | null
}

export default function AdminPlatformPayoutsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [gyms, setGyms] = useState<GymRow[]>([])
  const [gymFilter, setGymFilter] = useState('')
  const [gymId, setGymId] = useState('')
  const [mode, setMode] = useState<'pending' | 'completed'>('pending')
  const [wiseTransferId, setWiseTransferId] = useState('')
  const [bookingIdsRaw, setBookingIdsRaw] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingGyms, setLoadingGyms] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [copiedField, setCopiedField] = useState<'email' | 'name' | null>(null)

  const bookingIds = useMemo(() => parseBookingIds(bookingIdsRaw), [bookingIdsRaw])

  const filteredGyms = useMemo(() => {
    const q = gymFilter.trim().toLowerCase()
    if (!q) return gyms
    return gyms.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q) ||
        (g.city && g.city.toLowerCase().includes(q)) ||
        (g.country && g.country.toLowerCase().includes(q))
    )
  }, [gyms, gymFilter])

  const selectedGym = useMemo(() => gyms.find((g) => g.id === gymId) ?? null, [gyms, gymId])

  const loadGyms = useCallback(async () => {
    if (!user || profile?.role !== 'admin') return
    setLoadingGyms(true)
    try {
      const supabase = createClient()
      const { data, error: qErr } = await supabase
        .from('gyms')
        .select(
          'id, name, city, country, payout_rail, currency, wise_recipient_email, wise_recipient_account_holder_name, wise_recipient_currency',
        )
        .order('name', { ascending: true })
        .limit(2000)
      if (qErr) throw new Error(qErr.message)
      setGyms((data || []) as GymRow[])
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to load gyms')
    } finally {
      setLoadingGyms(false)
    }
  }, [user, profile?.role])

  useEffect(() => {
    if (authLoading) return
    if (profile?.role !== 'admin') return
    void loadGyms()
  }, [authLoading, profile?.role, loadGyms])

  useEffect(() => {
    setCopiedField(null)
  }, [gymId])

  const copyOpsValue = useCallback(async (field: 'email' | 'name', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField((c) => (c === field ? null : c)), 2000)
    } catch (e) {
      console.error('Clipboard write failed', e)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!gymId.trim()) {
      setError('Select a gym.')
      return
    }
    if (bookingIds.length === 0) {
      setError('Add at least one valid booking UUID.')
      return
    }
    if (mode === 'pending' && !wiseTransferId.trim()) {
      setError('Pending Wise transfers require the Wise transfer id (external reference).')
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        gym_id: gymId.trim(),
        booking_ids: bookingIds,
        rail: 'wise',
        notes: notes.trim() || null,
      }
      if (mode === 'pending') {
        body.status = 'pending'
        body.external_reference = wiseTransferId.trim()
      } else {
        body.external_reference = wiseTransferId.trim() || null
      }

      const res = await fetch('/api/admin/gym-platform-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
      setResult(data)
      if (mode === 'pending') {
        setWiseTransferId('')
        setBookingIdsRaw('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[40svh] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <div className="flex items-center gap-2 text-[#003580]">
          <Banknote className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Platform payouts</h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Record host payout batches for listings on the <strong>platform payout rail</strong> (not Stripe Connect).
          Use <em>pending</em> when a Wise transfer is in flight so the webhook can close the loop automatically.
        </p>
      </div>

      <Card className="border-amber-100 bg-amber-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-amber-950">
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
            Internal runbook
          </CardTitle>
          <CardDescription className="text-amber-950/90">
            Full checklist: <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">docs/internal/ops-platform-payouts-runbook.md</code>
            — Wise subscription URL <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">/api/webhooks/wise</code>,{' '}
            <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">pending</code> +{' '}
            <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">external_reference</code> (transfer id), and
            completed vs webhook flows.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record batch</CardTitle>
          <CardDescription>
            Parsed booking ids: {bookingIds.length > 0 ? bookingIds.length : '—'} (paste UUIDs separated by comma,
            space, or newline)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(ev) => void onSubmit(ev)} className="space-y-5">
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
                {error}
              </div>
            ) : null}

            {result ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
                <p className="font-medium">Saved</p>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="gym-filter">Find gym</Label>
              <Input
                id="gym-filter"
                value={gymFilter}
                onChange={(e) => setGymFilter(e.target.value)}
                placeholder="Filter by name, city, or paste UUID…"
                disabled={loadingGyms}
                className="max-w-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gym-select">Gym</Label>
              {loadingGyms ? (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading gyms…
                </p>
              ) : (
                <select
                  id="gym-select"
                  value={gymId}
                  onChange={(e) => setGymId(e.target.value)}
                  className="flex h-10 w-full max-w-lg rounded-md border border-gray-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/30"
                  required
                >
                  <option value="">Select gym…</option>
                  {filteredGyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.city || '—'}, {g.country || '—'} ({g.payout_rail || 'wise'}) · {g.currency || '—'}
                    </option>
                  ))}
                </select>
              )}
              {selectedGym && selectedGym.payout_rail === 'stripe_connect' ? (
                <p className="text-sm text-amber-800">
                  This gym uses Stripe Connect — platform payout batches do not apply. Use Stripe / Partner Hub
                  balances instead.
                </p>
              ) : null}

              {selectedGym && selectedGym.payout_rail !== 'stripe_connect' ? (
                <div className="max-w-2xl rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
                  <p className="font-medium text-slate-900">Wise recipient (pay-to-email)</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Copy into Wise when sending a manual transfer. Snapshot from Manage payout setup — not bank
                    details.
                  </p>
                  <dl className="mt-3 space-y-3">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
                      <dd className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="min-w-0 break-all font-mono text-[13px] text-slate-900">
                          {selectedGym.wise_recipient_email?.trim() || '—'}
                        </span>
                        {selectedGym.wise_recipient_email?.trim() ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 gap-1.5 border-slate-200 bg-white text-xs"
                            onClick={() =>
                              void copyOpsValue('email', selectedGym.wise_recipient_email!.trim())
                            }
                          >
                            {copiedField === 'email' ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                            ) : (
                              <Copy className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {copiedField === 'email' ? 'Copied' : 'Copy'}
                          </Button>
                        ) : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Account holder name
                      </dt>
                      <dd className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="min-w-0 break-words font-mono text-[13px] text-slate-900">
                          {selectedGym.wise_recipient_account_holder_name?.trim() || '—'}
                        </span>
                        {selectedGym.wise_recipient_account_holder_name?.trim() ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 gap-1.5 border-slate-200 bg-white text-xs"
                            onClick={() =>
                              void copyOpsValue(
                                'name',
                                selectedGym.wise_recipient_account_holder_name!.trim(),
                              )
                            }
                          >
                            {copiedField === 'name' ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                            ) : (
                              <Copy className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {copiedField === 'name' ? 'Copied' : 'Copy'}
                          </Button>
                        ) : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Wise recipient currency
                      </dt>
                      <dd className="mt-1 font-mono text-[13px] text-slate-900">
                        {selectedGym.wise_recipient_currency?.trim() || '—'}
                        {selectedGym.currency &&
                        selectedGym.wise_recipient_currency?.trim() &&
                        selectedGym.currency.trim().toUpperCase() !==
                          selectedGym.wise_recipient_currency.trim().toUpperCase() ? (
                          <span className="ml-2 text-xs font-sans text-slate-500">
                            (listing currency: {selectedGym.currency})
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  </dl>
                  {!selectedGym.wise_recipient_email?.trim() &&
                  !selectedGym.wise_recipient_account_holder_name?.trim() ? (
                    <p className="mt-3 border-t border-slate-200/80 pt-3 text-xs text-amber-900">
                      No snapshot yet — owner has not completed Wise pay-to-email setup in Manage, or payout
                      settings were reset after setup.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-900">Record as</legend>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'pending'}
                    onChange={() => setMode('pending')}
                    className="text-[#003580]"
                  />
                  Pending Wise transfer (webhook completes paid-out)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'completed'}
                    onChange={() => setMode('completed')}
                    className="text-[#003580]"
                  />
                  Completed now (paid out — no webhook)
                </label>
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="wise-tid">
                {mode === 'pending' ? 'Wise transfer id' : 'External reference (optional)'}
              </Label>
              <Input
                id="wise-tid"
                value={wiseTransferId}
                onChange={(e) => setWiseTransferId(e.target.value)}
                placeholder={mode === 'pending' ? 'e.g. 62410246' : 'Reference or leave blank'}
                className="max-w-lg font-mono text-sm"
                required={mode === 'pending'}
              />
              {mode === 'pending' ? (
                <p className="text-xs text-gray-500">
                  Must match the transfer id in Wise so <code className="rounded bg-gray-100 px-1">transfers#state-change</code> can match this row.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bids">Booking UUIDs</Label>
              <textarea
                id="bids"
                value={bookingIdsRaw}
                onChange={(e) => setBookingIdsRaw(e.target.value)}
                rows={5}
                placeholder={'8f2c…a1\n9d0e…b2'}
                className="w-full max-w-2xl rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. March manual run, ticket #123"
                className="max-w-2xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={submitting || selectedGym?.payout_rail === 'stripe_connect' || !gymId}
                className="bg-[#003580] text-white hover:bg-[#002a5c]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : mode === 'pending' ? (
                  'Create pending payout row'
                ) : (
                  'Record completed payout'
                )}
              </Button>
              <Link href="/admin" className="text-sm text-[#003580] underline-offset-2 hover:underline">
                Back to admin overview
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
