'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizeGymCurrency } from '@/lib/constants/gym-currencies'
import { gymCountryToStripeIso2 } from '@/lib/stripe/gym-country'
import { cn } from '@/lib/utils'
import type { Gym } from '@/lib/types/database'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

type Props = {
  gymId: string
  gym: Gym
  accountEmail: string | null
  defaultAccountHolderName: string
  onGymRefresh: () => void
  /** Fires on first user intent to run Stripe setup so the parent can load embedded tools. */
  onStripeSetupStarted?: () => void
}

function payoutCurrencyLabel(gym: Gym): string {
  return normalizeGymCurrency((gym.currency || 'THB') as string, 'THB')
}

function StripePayoutExplainer({ gym }: { gym: Gym }) {
  const ccy = payoutCurrencyLabel(gym)
  const iso2 = gymCountryToStripeIso2(gym.country)
  const thailand = iso2 === 'TH'

  return (
    <div className="space-y-3 text-sm leading-relaxed text-gray-700">
      <p>
        Guest payments are settled through <strong className="font-semibold text-gray-900">Stripe</strong>. Stripe
        sends payouts in <strong className="font-semibold text-gray-900">{ccy}</strong> to the local bank account you
        add during setup—same currency as your listing, so what you see is what lands in your bank for payouts.
      </p>
      {thailand ? (
        <p>
          For Thailand, that typically means <strong className="font-semibold text-gray-900">THB</strong> deposited to
          a domestic account (for example Kasikorn, Bangkok Bank, SCB, or Krungthai), once Stripe has verified your
          details.
        </p>
      ) : (
        <p>
          Use a bank account in the country and currency Stripe expects for your listing; domestic transfers usually
          arrive on Stripe&apos;s standard schedule.
        </p>
      )}
      <p className="text-xs leading-relaxed text-gray-600">
        Standard payout timing is usually free or low-cost on Stripe&apos;s default schedule. If a currency conversion
        applies, Stripe uses its published rates—any charges are shown before you confirm in their flow.
      </p>
      <p className="border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
        We route every partner through the same payout checks with Stripe—identity and bank details verified the same
        way—so earnings stay fair, traceable, and secure for everyone on the platform.
      </p>
    </div>
  )
}

export function ManagePayoutPreferencesForm({
  gymId,
  gym,
  accountEmail: _accountEmail,
  defaultAccountHolderName: _defaultAccountHolderName,
  onGymRefresh,
  onStripeSetupStarted,
}: Props) {
  void _accountEmail
  void _defaultAccountHolderName
  const [error, setError] = useState<string | null>(null)
  const [savingRail, setSavingRail] = useState(false)

  const payoutComplete = Boolean(gym.stripe_connect_verified)
  const hasStripeAccount = Boolean(gym.stripe_account_id)

  const openStripeConnectFlow = async () => {
    onStripeSetupStarted?.()
    setSavingRail(true)
    setError(null)
    try {
      const serverRail = (gym.payout_rail as 'wise' | 'stripe_connect') || 'wise'
      if (serverRail !== 'stripe_connect') {
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
        <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">Payouts</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            One short setup links your bank so earnings from bookings can be paid out automatically.
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <StripePayoutExplainer gym={gym} />

          {!payoutComplete ? (
            <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="max-w-xl space-y-2 text-xs leading-relaxed text-gray-600">
                <p>
                  Use the button to start. A secure Stripe window may open for verification—if you are new to Stripe,
                  enter an email there to continue. When that window closes, you pick up here automatically.
                </p>
                <p className="text-gray-500">
                  Remaining steps run below on this page; Balances shows activity when your account is ready.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => void openStripeConnectFlow()}
                disabled={savingRail}
                className="h-9 shrink-0 bg-[#003580] px-5 text-sm font-medium text-white hover:bg-[#002a5c] sm:w-auto"
              >
                {savingRail ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    Preparing…
                  </>
                ) : hasStripeAccount ? (
                  'Continue payout setup'
                ) : (
                  'Start payout setup'
                )}
              </Button>
            </div>
          ) : (
            <p className="border-t border-gray-100 pt-5 text-sm text-gray-600">
              Your payout account is connected. Payout dates, transfers, and exports for this listing are on{' '}
              <Link
                href={`/manage/balances?gym_id=${encodeURIComponent(gymId)}`}
                className="font-medium text-[#003580] underline-offset-2 hover:underline"
              >
                Balances
              </Link>
              . Update bank details or verification in the section below if Stripe requests them.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
