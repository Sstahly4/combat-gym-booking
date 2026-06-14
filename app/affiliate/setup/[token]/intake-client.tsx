'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ShieldCheck } from 'lucide-react'
import { PayPalMark } from '@/components/affiliate/paypal-mark'
import {
  AFFILIATE_PAYOUT_COUNTRIES,
  AUSTRALIA_COUNTRY,
  intakePayoutDescription,
  isAustraliaCountry,
} from '@/lib/affiliates/payout-region'

type LoadState =
  | { status: 'loading' }
  | { status: 'invalid'; reason: string }
  | { status: 'ready'; affiliateName: string }
  | { status: 'done' }

const REASON_COPY: Record<string, string> = {
  not_found: 'This link is not valid. Ask CombatStay to send you a fresh payout setup link.',
  used: 'These payout details were already submitted. If you need to change them, contact CombatStay.',
  revoked: 'This link has been cancelled. Ask CombatStay for a new one.',
  expired: 'This link has expired. Ask CombatStay for a new payout setup link.',
  missing: 'This link is incomplete. Open the original link from your email or message.',
  misconfigured: 'Payout setup is temporarily unavailable. Please try again later or contact us.',
}

export function AffiliateIntakeClient({ token }: { token: string }) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [name, setName] = useState('')
  const [payoutCountry, setPayoutCountry] = useState(AUSTRALIA_COUNTRY)
  const [bsb, setBsb] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAu = useMemo(() => isAustraliaCountry(payoutCountry), [payoutCountry])

  useEffect(() => {
    let cancelled = false
    async function validate() {
      try {
        const res = await fetch(`/api/affiliate/setup/${encodeURIComponent(token)}`)
        const data = await res.json()
        if (cancelled) return
        if (!data.valid) {
          setLoad({ status: 'invalid', reason: data.reason || 'not_found' })
          return
        }
        setName(data.affiliate_name || '')
        setLoad({ status: 'ready', affiliateName: data.affiliate_name || '' })
      } catch {
        if (!cancelled) setLoad({ status: 'invalid', reason: 'misconfigured' })
      }
    }
    validate()
    return () => {
      cancelled = true
    }
  }, [token])

  async function onSubmit(e: FormEvent) {
    if (load.status !== 'ready') return
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/affiliate/setup/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          payout_country: payoutCountry,
          bsb,
          account_number: accountNumber,
          paypal_email: paypalEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setLoad({ status: 'done' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (load.status === 'loading') {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-lg items-center justify-center px-6 py-16">
        <p className="text-sm text-stone-500">Loading secure form…</p>
      </main>
    )
  }

  if (load.status === 'invalid') {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">Link not available</h1>
        <p className="mt-3 text-stone-600">{REASON_COPY[load.reason] || REASON_COPY.not_found}</p>
        <Link
          href="mailto:hello@combatstay.com"
          className="mt-8 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Contact CombatStay
        </Link>
      </main>
    )
  }

  if (load.status === 'done') {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">Details saved securely</h1>
        <p className="mt-3 text-stone-600">
          Your payout information is encrypted and stored. This link has expired — you can close this
          page. CombatStay will email you when monthly payouts are processed.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">CombatStay affiliates</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">Payout setup</h1>
        <p className="mt-2 text-sm text-stone-600">
          Tell us where you are based and how to pay you. Details are encrypted and only used for
          commission payouts.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name (as it appears on your account)</Label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payout_country">Country of residence</Label>
          <Select
            id="payout_country"
            required
            value={payoutCountry}
            onChange={(e) => setPayoutCountry(e.target.value)}
          >
            {AFFILIATE_PAYOUT_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </Select>
          <p className="text-xs text-stone-500">{intakePayoutDescription(payoutCountry)}</p>
        </div>

        {isAu ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="bsb">BSB</Label>
              <Input
                id="bsb"
                required
                inputMode="numeric"
                placeholder="000-000"
                value={bsb}
                onChange={(e) => setBsb(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Account number</Label>
              <Input
                id="account_number"
                required
                inputMode="numeric"
                autoComplete="off"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <PayPalMark />
            <div className="space-y-2">
              <Label htmlFor="paypal_email">PayPal email</Label>
              <Input
                id="paypal_email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
              <p className="text-xs text-stone-500">
                Must match the email on your PayPal account. Payouts are sent from CombatStay via PayPal.
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-stone-500">
          This is a one-time secure link. After you submit, it cannot be used again.
        </p>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Saving securely…' : 'Submit payout details'}
        </Button>
      </form>
    </main>
  )
}
