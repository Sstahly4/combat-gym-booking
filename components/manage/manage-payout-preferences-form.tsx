'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CreditCard, Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { GYM_CURRENCY_OPTIONS, normalizeGymCurrency } from '@/lib/constants/gym-currencies'
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
  const router = useRouter()
  const [payoutRail, setPayoutRail] = useState<'wise' | 'stripe_connect'>('wise')
  const [currency, setCurrency] = useState('THB')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savingRail, setSavingRail] = useState(false)
  const [savingRecipient, setSavingRecipient] = useState(false)

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

  const saveRail = async () => {
    setSavingRail(true)
    setError(null)
    try {
      const res = await fetch(`/api/gyms/${encodeURIComponent(gymId)}/payout-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_rail: payoutRail,
          ...(payoutRail === 'wise' ? { wise_recipient_currency: currency } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save payout preferences')
      await onGymRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingRail(false)
    }
  }

  /** Stripe Connect: persist `stripe_connect` then open hosted onboarding (standard one-step CTA). */
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
      router.push(`/manage/stripe-connect?gym_id=${encodeURIComponent(gymId)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingRail(false)
    }
  }

  const saveRecipient = async () => {
    setSavingRecipient(true)
    setError(null)
    try {
      const res = await fetch('/api/wise/recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymId,
          currency,
          account_holder_name: accountHolderName,
          email,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save recipient details')
      await onGymRefresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingRecipient(false)
    }
  }

  const wiseReady = Boolean(gym.wise_payout_ready && gym.wise_recipient_id)

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
          <h2 className="text-sm font-semibold text-gray-900">Payout method</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            Industry-standard rails. You can change later; switching away from Wise clears saved Wise recipient data.
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
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
                    <span className="block text-sm font-semibold text-gray-900">Wise</span>
                    <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                      Payouts through Wise — common for international gyms.
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
                    <span className="block text-sm font-semibold text-gray-900">Stripe</span>
                    <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                      Stripe Connect — balances, tax forms, and payout history in one flow.
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
          </div>

          {payoutRail === 'wise' ? (
            <div className="rounded-xl border border-gray-200/90 bg-gray-50/50 p-4 sm:p-5">
              <Label htmlFor="payout-ccy" className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Payout currency
              </Label>
              <Select
                id="payout-ccy"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-2 max-w-md border-gray-200 bg-white"
              >
                {GYM_CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {payoutRail === 'wise' ? (
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Save your payout method, then add recipient details below.
              </p>
              <Button
                type="button"
                onClick={() => void saveRail()}
                disabled={savingRail}
                className="h-9 shrink-0 bg-[#003580] px-5 text-sm font-medium text-white hover:bg-[#002a5c] sm:w-auto"
              >
                {savingRail ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  'Save method'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-xl text-xs leading-relaxed text-gray-500">
                Identity and bank verification are completed in Stripe&apos;s secure flow. Continuing saves the
                connected-account payout route for this listing and opens onboarding; balances update when Stripe
                enables your account.
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
                    Opening…
                  </>
                ) : gym.stripe_account_id && !gym.stripe_connect_verified ? (
                  'Continue in Stripe'
                ) : (
                  'Open Stripe setup'
                )}
              </Button>
            </div>
          )}
        </div>
      </section>

      {payoutRail === 'wise' ? (
        <section className={cn(dashCard, 'overflow-hidden')}>
          <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">Wise recipient</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
              Legal name and email for payouts. The email should match the Wise account that will receive funds.
            </p>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pay-name" className="text-xs font-medium text-gray-700">
                  Account holder name
                </Label>
                <Input
                  id="pay-name"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Legal or business name"
                  autoComplete="name"
                  className="border-gray-200 bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-email" className="text-xs font-medium text-gray-700">
                  Recipient email
                </Label>
                <Input
                  id="pay-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="border-gray-200 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {wiseReady
                  ? 'Recipient is on file. You can update details before your first payout.'
                  : 'Save recipient to complete this step for go-live readiness.'}
              </p>
              <Button
                type="button"
                onClick={() => void saveRecipient()}
                disabled={savingRecipient}
                className="h-9 shrink-0 bg-[#003580] px-5 text-sm font-medium text-white hover:bg-[#002a5c] sm:w-auto"
              >
                {savingRecipient ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  'Save recipient'
                )}
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
