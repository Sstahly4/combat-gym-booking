'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PayPalMark } from '@/components/affiliate/paypal-mark'
import { CopyReferralLink } from '@/components/admin/copy-referral-link'
import {
  AFFILIATE_PAYOUT_COUNTRIES,
  AUSTRALIA_COUNTRY,
  intakePayoutDescription,
  isAustraliaCountry,
} from '@/lib/affiliates/payout-region'
import {
  affiliateCodeValidationError,
  normalizeAffiliateCode,
} from '@/lib/affiliates/code'
import {
  AFFILIATE_INVITE_INVALID_REASON_COPY,
  affiliateInviteLinkPartnerNote,
  affiliateWelcomeBullets,
  tierDisplayName,
} from '@/lib/affiliates/program-copy'
import type { AffiliateTier } from '@/lib/types/database'
import { Check, Sparkles } from 'lucide-react'

type LoadState =
  | { status: 'loading' }
  | { status: 'invalid'; reason: string }
  | {
      status: 'ready'
      affiliateId: string
      tier: AffiliateTier
      tierLabel: string
      expiresAt: string
    }
  | { status: 'done'; referralUrl: string; code: string }

const REASON_COPY = AFFILIATE_INVITE_INVALID_REASON_COPY

function appOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://www.combatstay.com'
}

export function AffiliateIntakeClient({ token }: { token: string }) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [payoutCountry, setPayoutCountry] = useState(AUSTRALIA_COUNTRY)
  const [bsb, setBsb] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [paypalEmail, setPaypalEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)

  const isAu = useMemo(() => isAustraliaCountry(payoutCountry), [payoutCountry])
  const affiliateId = load.status === 'ready' ? load.affiliateId : null
  const tier = load.status === 'ready' ? load.tier : 'founding'

  const codePreview = useMemo(() => {
    const normalized = normalizeAffiliateCode(code)
    if (!normalized) return null
    return `${appOrigin()}/ref/${normalized}`
  }, [code])

  const checkCode = useCallback(async () => {
    const normalized = normalizeAffiliateCode(code)
    const validationError = affiliateCodeValidationError(normalized)
    if (validationError || !affiliateId) {
      setCodeAvailable(validationError ? false : null)
      return
    }
    setCheckingCode(true)
    try {
      const params = new URLSearchParams({ code: normalized, exclude_id: affiliateId })
      const res = await fetch(`/api/affiliate/check-code?${params}`)
      const data = await res.json()
      setCodeAvailable(Boolean(data.available))
    } catch {
      setCodeAvailable(null)
    } finally {
      setCheckingCode(false)
    }
  }, [code, affiliateId])

  useEffect(() => {
    if (!affiliateId) return
    const t = setTimeout(checkCode, 400)
    return () => clearTimeout(t)
  }, [checkCode, affiliateId])

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
        setLoad({
          status: 'ready',
          affiliateId: data.affiliate_id,
          tier: data.tier === 'standard' ? 'standard' : 'founding',
          tierLabel: data.tier_label || tierDisplayName(data.tier),
          expiresAt: data.expires_at,
        })
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
          email,
          code,
          payout_country: payoutCountry,
          bsb,
          account_number: accountNumber,
          paypal_email: paypalEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const reason = data.reason as string | undefined
        if (reason && REASON_COPY[reason]) {
          throw new Error(REASON_COPY[reason])
        }
        throw new Error(data.error || 'Submission failed')
      }
      setLoad({
        status: 'done',
        referralUrl: data.referral_url,
        code: data.code,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (load.status === 'loading') {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-lg items-center justify-center px-6 py-16">
        <p className="text-sm text-stone-500">Loading your invite…</p>
      </main>
    )
  }

  if (load.status === 'invalid') {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">
          {load.reason === 'used' || load.reason === 'already_setup'
            ? 'Setup already complete'
            : 'Invite not available'}
        </h1>
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
      <main className="mx-auto min-h-[calc(100svh-5rem)] max-w-lg px-4 py-10 sm:py-16">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Sparkles className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            You&apos;re in — here&apos;s your link
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Payout details saved securely. Share the link below anywhere you talk about CombatStay —
            bio, email, social posts, DMs.
          </p>

          <div className="mt-8 rounded-xl border border-emerald-300/60 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Your referral link
            </p>
            <div className="mt-3 flex flex-col items-center gap-3">
              <code className="break-all text-base font-semibold text-[#003580] sm:text-lg">
                {load.referralUrl}
              </code>
              <CopyReferralLink url={load.referralUrl} label="Copy referral link" prominent />
            </div>
          </div>

          <ul className="mt-8 space-y-2 text-left text-sm text-stone-600">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Anyone who books within 30 days of clicking earns you commission.
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Payouts run monthly once your balance clears the minimum.
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Screenshot this page if you want a backup — we&apos;ve got your details on file.
            </li>
          </ul>
        </div>
      </main>
    )
  }

  const welcomeBullets = affiliateWelcomeBullets(tier)

  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      {/* Section 1 — Welcome */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">CombatStay affiliates</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">
          Welcome, {load.tierLabel}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Complete the form below to claim your referral code and set up payouts.
        </p>
        {load.expiresAt && (
          <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            {affiliateInviteLinkPartnerNote(load.expiresAt)}
          </p>
        )}
        <ul className="mt-5 space-y-2.5 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          {welcomeBullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#003580]" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </header>

      <form onSubmit={onSubmit} className="space-y-8">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {/* Section 2 — Your details */}
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Your details</h2>
            <p className="mt-1 text-xs text-stone-500">How we&apos;ll contact you about payouts.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Choose your referral code</Label>
            <Input
              id="code"
              required
              placeholder="e.g. marklee, fightclub, elitefc"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
            />
            <p className="text-xs text-stone-500">
              Lowercase letters and numbers only, max 20 characters. Permanent once you share it.
            </p>
            {code && (
              <div className="text-xs">
                {affiliateCodeValidationError(code) ? (
                  <span className="text-red-600">{affiliateCodeValidationError(code)}</span>
                ) : checkingCode ? (
                  <span className="text-stone-500">Checking availability…</span>
                ) : codeAvailable === true && codePreview ? (
                  <span className="text-emerald-700">
                    Available — your link:{' '}
                    <strong className="font-mono">{codePreview}</strong>
                  </span>
                ) : codeAvailable === false ? (
                  <span className="text-red-600">This code is taken — try another</span>
                ) : null}
              </div>
            )}
            {codePreview && codeAvailable === true && (
              <div className="mt-2 rounded-lg border border-[#003580]/20 bg-[#003580]/5 px-3 py-2 font-mono text-sm text-[#003580]">
                {codePreview}
              </div>
            )}
          </div>
        </section>

        {/* Section 3 — Payout details */}
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Payout details</h2>
            <p className="mt-1 text-xs text-stone-500">Encrypted at rest — only used for commission payouts.</p>
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
            <div className="space-y-4 animate-in fade-in duration-200">
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
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4 animate-in fade-in duration-200">
              <PayPalMark className="h-7 w-[5.5rem]" />
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
              </div>
            </div>
          )}
        </section>

        <Button
          type="submit"
          className="h-12 w-full text-base"
          disabled={submitting || codeAvailable === false || checkingCode}
        >
          {submitting ? 'Setting up your account…' : 'Complete setup'}
        </Button>
      </form>
    </main>
  )
}
