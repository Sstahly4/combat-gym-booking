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
import {
  bookingEligibleForPlatformPayout,
  bookingNetShare,
  type PlatformBalanceBooking,
} from '@/lib/manage/compute-platform-route-balances'

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

function formatRangeShort(startIso: string, endIso: string): string {
  try {
    const s = new Date(startIso)
    const e = new Date(endIso)
    const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${s.toLocaleDateString(undefined, o)} – ${e.toLocaleDateString(undefined, o)}`
  } catch {
    return `${startIso} → ${endIso}`
  }
}

function formatMoneyMajor(amount: number, currencyCode: string): string {
  const code = (currencyCode || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${code}`
  }
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

type EligibleBookingRow = PlatformBalanceBooking & { net: number }

export default function AdminPlatformPayoutsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [gyms, setGyms] = useState<GymRow[]>([])
  const [gymFilter, setGymFilter] = useState('')
  const [gymId, setGymId] = useState('')
  const [mode, setMode] = useState<'pending' | 'completed'>('pending')
  const [wiseTransferId, setWiseTransferId] = useState('')
  const [extraBookingIdsRaw, setExtraBookingIdsRaw] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingGyms, setLoadingGyms] = useState(true)
  const [eligibleRows, setEligibleRows] = useState<EligibleBookingRow[]>([])
  const [loadingEligible, setLoadingEligible] = useState(false)
  const [eligibleError, setEligibleError] = useState<string | null>(null)
  const [bookingRowFilter, setBookingRowFilter] = useState('')
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [copiedField, setCopiedField] = useState<'email' | 'name' | 'total' | null>(null)
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null)

  const extraParsedIds = useMemo(() => parseBookingIds(extraBookingIdsRaw), [extraBookingIdsRaw])

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
  const payoutCurrency = (
    selectedGym?.wise_recipient_currency?.trim() ||
    selectedGym?.currency?.trim() ||
    'USD'
  ).toUpperCase()

  const visibleEligible = useMemo(() => {
    const q = bookingRowFilter.trim().toLowerCase()
    if (!q) return eligibleRows
    return eligibleRows.filter((r) => {
      const blob = [
        r.id,
        r.guest_name || '',
        r.discipline || '',
        r.status,
        r.start_date,
        r.end_date,
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [eligibleRows, bookingRowFilter])

  const selectedSet = useMemo(() => new Set(selectedBookingIds), [selectedBookingIds])

  const combinedBookingIds = useMemo(() => {
    const fromBoxes = selectedBookingIds
    const merged = [...new Set([...fromBoxes, ...extraParsedIds])]
    return merged.sort()
  }, [selectedBookingIds, extraParsedIds])

  const netById = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of eligibleRows) m.set(r.id, r.net)
    return m
  }, [eligibleRows])

  const selectedNetTotal = useMemo(() => {
    let sum = 0
    for (const id of combinedBookingIds) {
      const n = netById.get(id)
      if (n !== undefined) sum += n
    }
    return sum
  }, [combinedBookingIds, netById])

  const unknownPastedIds = useMemo(
    () => combinedBookingIds.filter((id) => !netById.has(id)),
    [combinedBookingIds, netById]
  )

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

  const loadEligibleBookings = useCallback(async () => {
    if (!user || profile?.role !== 'admin' || !gymId.trim()) return
    const rail = gyms.find((g) => g.id === gymId.trim())?.payout_rail
    if (rail === 'stripe_connect') {
      setEligibleRows([])
      setEligibleError(null)
      return
    }
    setLoadingEligible(true)
    setEligibleError(null)
    try {
      const supabase = createClient()
      const { data, error: qErr } = await supabase
        .from('bookings')
        .select(
          'id, status, total_price, platform_fee, start_date, end_date, guest_name, discipline, platform_payout_id, platform_paid_out_at',
        )
        .eq('gym_id', gymId.trim())
        .order('end_date', { ascending: true })
        .limit(800)
      if (qErr) throw new Error(qErr.message)
      const now = new Date()
      const raw = (data || []) as PlatformBalanceBooking[]
      const eligible: EligibleBookingRow[] = []
      for (const b of raw) {
        if (!bookingEligibleForPlatformPayout(b, now)) continue
        eligible.push({ ...b, net: bookingNetShare(b) })
      }
      setEligibleRows(eligible)
    } catch (e) {
      console.error(e)
      setEligibleError(e instanceof Error ? e.message : 'Failed to load bookings')
      setEligibleRows([])
    } finally {
      setLoadingEligible(false)
    }
  }, [user, profile?.role, gymId, gyms])

  useEffect(() => {
    if (authLoading) return
    if (profile?.role !== 'admin') return
    void loadGyms()
  }, [authLoading, profile?.role, loadGyms])

  useEffect(() => {
    setCopiedField(null)
    setCopiedBookingId(null)
    setSelectedBookingIds([])
    setExtraBookingIdsRaw('')
    setBookingRowFilter('')
    setEligibleRows([])
    setEligibleError(null)
  }, [gymId, selectedGym?.payout_rail])

  useEffect(() => {
    if (!gymId.trim() || selectedGym?.payout_rail === 'stripe_connect') return
    void loadEligibleBookings()
  }, [gymId, selectedGym?.payout_rail, loadEligibleBookings])

  const copyOpsValue = useCallback(async (field: 'email' | 'name' | 'total', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField((c) => (c === field ? null : c)), 2000)
    } catch (e) {
      console.error('Clipboard write failed', e)
    }
  }, [])

  const copyBookingId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedBookingId(id)
      window.setTimeout(() => setCopiedBookingId((c) => (c === id ? null : c)), 2000)
    } catch (e) {
      console.error('Clipboard write failed', e)
    }
  }, [])

  const toggleBooking = useCallback((id: string) => {
    setSelectedBookingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const selectAllVisible = useCallback(() => {
    setSelectedBookingIds((prev) => [...new Set([...prev, ...visibleEligible.map((r) => r.id)])])
  }, [visibleEligible])

  const clearSelection = useCallback(() => {
    setSelectedBookingIds([])
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!gymId.trim()) {
      setError('Select a gym.')
      return
    }
    if (combinedBookingIds.length === 0) {
      setError('Select at least one eligible booking, or paste valid booking UUIDs.')
      return
    }
    if (mode === 'pending' && !wiseTransferId.trim()) {
      setError('Pending Wise transfers require the Wise transfer id (from Wise after you submit the transfer).')
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        gym_id: gymId.trim(),
        booking_ids: combinedBookingIds,
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
      setWiseTransferId('')
      setExtraBookingIdsRaw('')
      setSelectedBookingIds([])
      void loadEligibleBookings()
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

  const showBookingPicker =
    Boolean(gymId) && selectedGym && selectedGym.payout_rail !== 'stripe_connect'

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <div className="flex items-center gap-2 text-[#003580]">
          <Banknote className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Platform payouts</h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Record host payout batches for listings on the <strong>platform payout rail</strong> (not Stripe Connect).
          Select bookings owed a transfer; the <strong>net</strong> total (guest payment minus platform fee) is what
          you send in Wise — the fee never leaves your platform Stripe balance. Use <em>pending</em> after you create
          the transfer in Wise so the webhook can mark bookings paid out.
        </p>
      </div>

      <Card className="border-amber-100 bg-amber-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-amber-950">
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
            Wise transfer id (when you need it)
          </CardTitle>
          <CardDescription className="text-amber-950/90">
            You do <strong>not</strong> need a transfer id to add a recipient in Wise or to start composing a
            transfer. Wise issues the id <strong>after</strong> you create/submit the transfer — copy that number from
            Wise and paste it here on <em>pending</em> so <code className="rounded bg-white/70 px-1 py-0.5 text-xs">/api/webhooks/wise</code> can match this batch. Full checklist:{' '}
            <code className="rounded bg-white/70 px-1 py-0.5 text-xs">docs/internal/ops-platform-payouts-runbook.md</code>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record batch</CardTitle>
          <CardDescription>
            {combinedBookingIds.length > 0
              ? `${combinedBookingIds.length} booking(s) in this batch · net to wire ${formatMoneyMajor(selectedNetTotal, payoutCurrency)}`
              : 'Choose a gym, tick bookings to pay out, then paste the Wise transfer id (pending) or mark completed.'}
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
                    Create the transfer in Wise for the net amount below using this email and name — not bank fields
                    stored here.
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

            {showBookingPicker ? (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <Label className="text-gray-900">Bookings available to pay out</Label>
                    <p className="mt-1 text-xs text-gray-600">
                      Paid / confirmed / completed, not yet marked paid out; for paid or confirmed, stay end date must
                      be before today. Net = guest total − platform fee (wire only the net).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-gray-200 bg-white text-xs"
                    onClick={() => void loadEligibleBookings()}
                    disabled={loadingEligible}
                  >
                    {loadingEligible ? (
                      <>
                        <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" aria-hidden />
                        Refresh
                      </>
                    ) : (
                      'Refresh list'
                    )}
                  </Button>
                </div>

                {eligibleError ? (
                  <p className="text-sm text-rose-800" role="alert">
                    {eligibleError}
                  </p>
                ) : null}

                {loadingEligible ? (
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading bookings…
                  </p>
                ) : eligibleRows.length === 0 ? (
                  <p className="text-sm text-gray-600">No eligible unpaid bookings for this gym.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={bookingRowFilter}
                        onChange={(e) => setBookingRowFilter(e.target.value)}
                        placeholder="Filter by id, guest, dates, status…"
                        className="max-w-md text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-200 bg-white text-xs"
                        onClick={selectAllVisible}
                        disabled={visibleEligible.length === 0}
                      >
                        Select all {bookingRowFilter.trim() ? 'visible' : ''} ({visibleEligible.length})
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-600"
                        onClick={clearSelection}
                        disabled={selectedBookingIds.length === 0}
                      >
                        Clear selection
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                      <table className="w-full min-w-[640px] text-left text-xs">
                        <thead className="border-b border-gray-200 bg-gray-50/90 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="w-10 px-2 py-2" scope="col">
                              <span className="sr-only">Select</span>
                            </th>
                            <th className="px-2 py-2" scope="col">
                              Booking
                            </th>
                            <th className="px-2 py-2" scope="col">
                              Stay
                            </th>
                            <th className="px-2 py-2" scope="col">
                              Guest
                            </th>
                            <th className="px-2 py-2" scope="col">
                              Status
                            </th>
                            <th className="px-2 py-2 text-right" scope="col">
                              Gross
                            </th>
                            <th className="px-2 py-2 text-right" scope="col">
                              Fee
                            </th>
                            <th className="px-2 py-2 text-right" scope="col">
                              Net
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {visibleEligible.map((r) => {
                            const gross = Number(r.total_price) || 0
                            const fee = Number(r.platform_fee) || 0
                            const checked = selectedSet.has(r.id)
                            return (
                              <tr key={r.id} className={checked ? 'bg-[#003580]/[0.04]' : undefined}>
                                <td className="px-2 py-2 align-top">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-[#003580] focus:ring-[#003580]/30"
                                    checked={checked}
                                    onChange={() => toggleBooking(r.id)}
                                    aria-label={`Select booking ${r.id}`}
                                  />
                                </td>
                                <td className="px-2 py-2 align-top font-mono text-[11px] text-gray-900">
                                  <div className="max-w-[11rem] break-all">{r.id}</div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 h-7 px-2 text-[11px] text-[#003580]"
                                    onClick={() => void copyBookingId(r.id)}
                                  >
                                    {copiedBookingId === r.id ? (
                                      <>
                                        <Check className="mr-1 inline h-3 w-3 text-emerald-600" aria-hidden />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="mr-1 inline h-3 w-3" aria-hidden />
                                        Copy id
                                      </>
                                    )}
                                  </Button>
                                </td>
                                <td className="px-2 py-2 align-top text-gray-700">
                                  {formatRangeShort(r.start_date, r.end_date)}
                                </td>
                                <td className="px-2 py-2 align-top text-gray-800">{r.guest_name?.trim() || '—'}</td>
                                <td className="px-2 py-2 align-top capitalize text-gray-700">{r.status}</td>
                                <td className="px-2 py-2 align-top text-right tabular-nums text-gray-800">
                                  {formatMoneyMajor(gross, payoutCurrency)}
                                </td>
                                <td className="px-2 py-2 align-top text-right tabular-nums text-gray-600">
                                  {formatMoneyMajor(fee, payoutCurrency)}
                                </td>
                                <td className="px-2 py-2 align-top text-right font-medium tabular-nums text-gray-900">
                                  {formatMoneyMajor(r.net, payoutCurrency)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {unknownPastedIds.length > 0 ? (
                      <p className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
                        {unknownPastedIds.length} pasted id(s) are not in the eligible table above (wrong gym, not
                        payable yet, or beyond the 800-row load). Net total only includes known rows — confirm amounts
                        in Wise before sending, or fix the selection.
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#003580]/20 bg-white px-3 py-2.5">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Net to wire (sum)</p>
                        <p className="text-lg font-semibold tabular-nums text-gray-900">
                          {formatMoneyMajor(selectedNetTotal, payoutCurrency)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Matches server validation (sum of host net shares for selected UUIDs).
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-gray-200 bg-white text-xs"
                        disabled={combinedBookingIds.length === 0 || selectedNetTotal <= 0}
                        onClick={() =>
                          void copyOpsValue('total', selectedNetTotal.toFixed(2))
                        }
                      >
                        {copiedField === 'total' ? (
                          <>
                            <Check className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600" aria-hidden />
                            Copied amount
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                            Copy net number
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="extra-bids" className="text-xs text-gray-600">
                    Optional: paste extra booking UUIDs (comma / newline). Merged with checkboxes; must belong to this
                    gym and be eligible, or save will fail.
                  </Label>
                  <textarea
                    id="extra-bids"
                    value={extraBookingIdsRaw}
                    onChange={(e) => setExtraBookingIdsRaw(e.target.value)}
                    rows={2}
                    placeholder="Only if a row is missing from the list above…"
                    className="w-full max-w-2xl rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-[11px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/30"
                  />
                </div>
              </div>
            ) : null}

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
                placeholder={mode === 'pending' ? 'Paste from Wise after creating the transfer' : 'Reference or leave blank'}
                className="max-w-lg font-mono text-sm"
                required={mode === 'pending'}
              />
              {mode === 'pending' ? (
                <p className="text-xs text-gray-500">
                  Create the transfer in Wise first for <strong>{formatMoneyMajor(selectedNetTotal, payoutCurrency)}</strong>
                  , then paste the transfer id Wise shows so{' '}
                  <code className="rounded bg-gray-100 px-1">transfers#state-change</code> can match this row.
                </p>
              ) : null}
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
                disabled={
                  submitting ||
                  selectedGym?.payout_rail === 'stripe_connect' ||
                  !gymId ||
                  combinedBookingIds.length === 0
                }
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
