'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, CreditCard, Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WisePayoutSetupPanel } from '@/components/manage/wise-payout-setup-panel'
import { normalizeGymCurrency } from '@/lib/constants/gym-currencies'
import { cn } from '@/lib/utils'
import type { Gym } from '@/lib/types/database'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

const methodCardBase =
  'relative flex w-full flex-col gap-1 rounded-xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#003580]/40 focus-visible:ring-offset-2'

type Props = {
  gymId: string
  gym: Gym
  accountEmail: string | null
  defaultAccountHolderName: string
  onGymRefresh: () => void
}

export function ManagePayoutPreferencesForm({
  gymId,
  gym,
  accountEmail,
  defaultAccountHolderName,
  onGymRefresh,
}: Props) {
  const [payoutRail, setPayoutRail] = useState<'wise' | 'stripe_connect'>('wise')
  const [currency, setCurrency] = useState('THB')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savingRail, setSavingRail] = useState(false)
  const [savingWiseDetails, setSavingWiseDetails] = useState(false)

  const syncFromGym = useCallback(() => {
    const rail = (gym.payout_rail as 'wise' | 'stripe_connect') || 'wise'
    setPayoutRail(rail)
    setCurrency(
      normalizeGymCurrency(
        (gym.wise_recipient_currency || gym.currency || 'THB') as string,
        'THB'
      )
    )
  }, [gym])

  useEffect(() => {
    syncFromGym()
  }, [syncFromGym])

  useEffect(() => {
    if (defaultAccountHolderName.trim()) {
      setAccountHolderName((prev) => (prev.trim() ? prev : defaultAccountHolderName))
    }
  }, [defaultAccountHolderName])

  useEffect(() => {
    if (accountEmail?.trim()) {
      setEmail((prev) => (prev.trim() ? prev : accountEmail.trim()))
    }
  }, [accountEmail])

  /** Stripe Connect: persist `stripe_connect`, ensure `acct_…` exists without hosted redirect, then scroll to embedded onboarding. */
  const openStripeConnectFlow = async () => {
    if (payoutRail !== 'stripe_connect') return
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

  /** Single action: persist Wise rail + payout currency, then register/update Wise recipient. */
  const saveWisePayoutDetails = async () => {
    setSavingWiseDetails(true)
    setError(null)
    try {
      const railRes = await fetch(`/api/gyms/${encodeURIComponent(gymId)}/payout-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_rail: 'wise',
          wise_recipient_currency: currency,
        }),
      })
      const railData = await railRes.json().catch(() => ({}))
      if (!railRes.ok) throw new Error(railData.error || 'Could not save payout currency')
      await onGymRefresh()

      const recRes = await fetch('/api/wise/recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymId,
          currency,
          account_holder_name: accountHolderName,
          email,
        }),
      })
      const recData = await recRes.json().catch(() => ({}))
      if (!recRes.ok) throw new Error(recData.error || 'Could not save recipient details')
      await onGymRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingWiseDetails(false)
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
          <h2 className="text-sm font-semibold text-gray-900">How you receive payouts</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            Choose one primary method per listing. You can change it later; switching away from Stripe Connect or bank
            transfer (Wise) clears the other route&apos;s saved details on this listing.
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPayoutRail('stripe_connect')}
              className={cn(
                methodCardBase,
                payoutRail === 'stripe_connect'
                  ? 'border-[#003580] bg-[#003580]/[0.07] shadow-sm ring-1 ring-[#003580]/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/90'
              )}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
                      payoutRail === 'stripe_connect'
                        ? 'bg-white text-[#003580] ring-[#003580]/25'
                        : 'bg-gray-50 text-gray-600 ring-gray-200/80'
                    )}
                  >
                    <CreditCard className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Stripe Connect</span>
                    <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                      Live balances and payouts in this hub — common when card acceptance runs through Stripe.
                    </span>
                  </span>
                </span>
                {payoutRail === 'stripe_connect' ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#003580] text-white" aria-hidden>
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </span>
                ) : null}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPayoutRail('wise')}
              className={cn(
                methodCardBase,
                payoutRail === 'wise'
                  ? 'border-[#003580] bg-[#003580]/[0.07] shadow-sm ring-1 ring-[#003580]/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/90'
              )}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
                      payoutRail === 'wise' ? 'bg-white text-[#003580] ring-[#003580]/25' : 'bg-gray-50 text-gray-600 ring-gray-200/80'
                    )}
                  >
                    <Wallet className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Bank transfer (Wise)</span>
                    <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                      International bank payouts via Wise—strong when your bank account is in another currency.
                    </span>
                  </span>
                </span>
                {payoutRail === 'wise' ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#003580] text-white" aria-hidden>
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </span>
                ) : null}
              </span>
            </button>
          </div>

          {payoutRail === 'stripe_connect' ? (
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-xl text-xs leading-relaxed text-gray-500">
                Verification runs inline on this page (no redirect). Use the button to save this payout route, create
                your connected account if needed, and jump to the setup form below. Balances update when your account is
                ready.
              </p>
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
                ) : gym.stripe_account_id && !gym.stripe_connect_verified ? (
                  'Continue payout setup'
                ) : (
                  'Connect payouts'
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {payoutRail === 'wise' ? (
        <WisePayoutSetupPanel
          gym={gym}
          accountEmail={accountEmail}
          currency={currency}
          onCurrencyChange={setCurrency}
          accountHolderName={accountHolderName}
          onAccountHolderNameChange={setAccountHolderName}
          email={email}
          onEmailChange={setEmail}
          savingDetails={savingWiseDetails}
          onSaveDetails={() => void saveWisePayoutDetails()}
        />
      ) : null}
    </div>
  )
}
