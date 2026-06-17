'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizeGymCurrency } from '@/lib/constants/gym-currencies'
import { cn } from '@/lib/utils'
import type { Gym } from '@/lib/types/database'
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  getPayoutGateCopy,
} from '@/lib/manage/stripe-payout-onboarding-copy'
import { StripePayoutRecoveryCard } from '@/components/manage/stripe-payout-recovery-card'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

const statTile =
  'rounded-xl border border-gray-200/80 bg-gray-50/40 px-4 py-3.5 sm:min-h-[5.5rem]'

type Props = {
  gymId: string
  gym: Gym
  accountEmail: string | null
  defaultAccountHolderName: string
  preferredLanguage?: string | null
  onGymRefresh: () => void
  onStripeSetupStarted?: () => void
}

function payoutCurrencyCode(gym: Gym): string {
  return normalizeGymCurrency((gym.currency || 'THB') as string, 'THB')
}

function currencyTitle(code: string): string {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'currency', style: 'long' }).of(code)
    if (name) return `${name} (${code})`
  } catch {
    /* ignore */
  }
  return code
}

function PayoutStatCards({ gym }: { gym: Gym }) {
  const code = payoutCurrencyCode(gym)
  const title = currencyTitle(code)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className={statTile}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Payout currency</p>
        <p className="mt-1.5 text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs leading-snug text-gray-600">Matched to your listing</p>
      </div>
      <div className={statTile}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Schedule</p>
        <p className="mt-1.5 text-sm font-semibold text-gray-900">Stripe automatic</p>
        <p className="mt-1 text-xs leading-snug text-gray-600">
          Bank payouts after cleared balance—arrival dates show in Balances.
        </p>
      </div>
      <div className={statTile}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Fees</p>
        <p className="mt-1.5 text-sm font-semibold text-gray-900">CombatStay platform fee</p>
        <p className="mt-1 text-xs leading-snug text-gray-600">
          From each booking total (no guest price markup). Card processing is billed by Stripe.
        </p>
      </div>
    </div>
  )
}

export function ManagePayoutPreferencesForm({
  gymId,
  gym,
  accountEmail: _accountEmail,
  defaultAccountHolderName: _defaultAccountHolderName,
  preferredLanguage,
  onGymRefresh,
  onStripeSetupStarted,
}: Props) {
  void _accountEmail
  void _defaultAccountHolderName
  const [error, setError] = useState<string | null>(null)
  const [savingRail, setSavingRail] = useState(false)

  const payoutComplete = Boolean(gym.stripe_connect_verified)
  const hasStripeAccount = Boolean(gym.stripe_account_id)
  const copy = getPayoutGateCopy(preferredLanguage)

  const primaryCtaLabel = hasStripeAccount ? 'Continue payout setup' : 'Start payout setup'

  const instructionNote = useMemo(() => {
    return (
      <>
        Click <strong className="font-semibold text-gray-900">{primaryCtaLabel}</strong> below. A secure verification
        window may open—follow the prompts and it closes automatically when you are done.
      </>
    )
  }, [primaryCtaLabel])

  const openStripeConnectFlow = async () => {
    onStripeSetupStarted?.()
    setSavingRail(true)
    setError(null)
    try {
      if (gym.payout_rail !== 'stripe_connect') {
        const res = await fetch(`/api/gyms/${encodeURIComponent(gymId)}/payout-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payout_rail: 'stripe_connect' }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Could not save payout preferences')
        await onGymRefresh()
      }
      const caRes = await fetch('/api/stripe/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gym_id: gymId, embedded_only: true }),
      })
      const caData = await caRes.json().catch(() => ({}))
      if (!caRes.ok) throw new Error(caData.error || 'Could not prepare your payout account')
      await onGymRefresh()
      if (typeof window !== 'undefined') {
        window.location.hash = 'stripe-onboarding'
        window.requestAnimationFrame(() => {
          document.getElementById('stripe-onboarding')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingRail(false)
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
          className="rounded-xl border border-rose-200/90 bg-rose-50/90 px-4 py-3 text-sm text-rose-900 shadow-sm shadow-rose-900/5"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <section className={cn(dashCard, 'overflow-hidden')}>
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Payouts</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-700">
              Earnings from bookings are paid directly to your bank account in your local currency—no international wire
              fees.
            </p>
          </div>

          <PayoutStatCards gym={gym} />

          {!payoutComplete ? (
            <div className="space-y-4">
              {/* P3: Recovery context — shown when setup has been started but not finished */}
              {hasStripeAccount && (
                <StripePayoutRecoveryCard
                  preferredLanguage={preferredLanguage}
                  currentlyDue={(gym.stripe_requirements_currently_due as string[] | null) ?? []}
                  lastSyncAt={gym.last_stripe_account_sync_at ?? null}
                />
              )}

              {/* P1: Pre-drawer gate — stays visible until payout setup is complete */}
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm shadow-gray-900/[0.03]">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#003580]/10 ring-1 ring-[#003580]/15">
                    <ShieldCheck className="h-4 w-4 text-[#003580]" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-semibold text-gray-900">{copy.gateTitle}</p>
                    <p className="text-[13px] leading-relaxed text-gray-600">{copy.gateBody}</p>

                    {/* App store links */}
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <a
                        href={APP_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        {copy.appStoreLabel}
                        <ExternalLink className="h-3 w-3 text-gray-400" aria-hidden />
                      </a>
                      <a
                        href={PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        {copy.playStoreLabel}
                        <ExternalLink className="h-3 w-3 text-gray-400" aria-hidden />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruction + CTA */}
              <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3.5 text-sm leading-relaxed text-gray-700">
                {instructionNote}
              </div>
              <Button
                type="button"
                onClick={() => void openStripeConnectFlow()}
                disabled={savingRail}
                className="h-10 w-full bg-[#003580] px-5 text-sm font-medium text-white hover:bg-[#002a5c] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
              >
                {savingRail ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    Preparing…
                  </>
                ) : (
                  primaryCtaLabel
                )}
              </Button>
            </div>
          ) : (
            <p className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 text-sm leading-relaxed text-emerald-950">
              You&apos;re set up for payouts. Activity and exports for this listing are on{' '}
              <Link
                href={`/manage/balances?gym_id=${encodeURIComponent(gymId)}`}
                className="font-semibold text-[#003580] underline-offset-2 hover:underline"
              >
                Balances
              </Link>
              . Bank details below if Stripe needs an update.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
