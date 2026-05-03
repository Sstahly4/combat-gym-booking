'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { GYM_CURRENCY_OPTIONS, normalizeGymCurrency } from '@/lib/constants/gym-currencies'
import type { Gym } from '@/lib/types/database'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

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
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>
      ) : null}

      <section className={dashCard}>
        <header className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">How you get paid</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Choose how earnings from completed stays are sent. You can change this later; switching away from bank
            transfer clears saved recipient details.
          </p>
        </header>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <Label htmlFor="payout-rail">Payout method</Label>
            <Select
              id="payout-rail"
              value={payoutRail}
              onChange={(e) => setPayoutRail(e.target.value as 'wise' | 'stripe_connect')}
            >
              <option value="wise">Bank transfer (Wise)</option>
              <option value="stripe_connect">Connected payout account</option>
            </Select>
          </div>
          {payoutRail === 'wise' ? (
            <div className="space-y-2">
              <Label htmlFor="payout-ccy">Payout currency</Label>
              <Select id="payout-ccy" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {GYM_CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" onClick={() => void saveRail()} disabled={savingRail} className="bg-[#003580] text-white hover:bg-[#002a5c]">
              {savingRail ? 'Saving…' : 'Save preferences'}
            </Button>
          </div>
          {payoutRail === 'stripe_connect' ? (
            <p className="text-sm text-gray-600">
              Next, open{' '}
              <Link
                href={`/manage/stripe-connect?gym_id=${encodeURIComponent(gymId)}`}
                className="font-medium text-[#003580] underline-offset-2 hover:underline"
              >
                Connected account
              </Link>{' '}
              to finish identity and bank details for payouts.
            </p>
          ) : null}
        </div>
      </section>

      {payoutRail === 'wise' ? (
        <section className={dashCard}>
          <header className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Recipient details</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Name and email for where we send payouts. The email should match the account that will receive transfers.
            </p>
          </header>
          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="pay-name">Account holder name</Label>
              <Input
                id="pay-name"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Legal or business name"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-email">Recipient email</Label>
              <Input
                id="pay-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                onClick={() => void saveRecipient()}
                disabled={savingRecipient}
                className="bg-[#003580] text-white hover:bg-[#002a5c]"
              >
                {savingRecipient ? 'Saving…' : 'Save recipient'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {wiseReady
                ? `Recipient saved. You can update details anytime before your first payout.`
                : 'Save preferences above, then save recipient details to mark this step complete for go-live.'}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  )
}
