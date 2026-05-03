'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Gym } from '@/lib/types/database'

const CURRENCIES = ['THB', 'USD', 'EUR'] as const

export default function ManagePayoutSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymIdParam = searchParams.get('gym_id')?.trim() || ''
  const { user, profile, loading: authLoading } = useAuth()

  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingRail, setSavingRail] = useState(false)
  const [savingRecipient, setSavingRecipient] = useState(false)

  const [payoutRail, setPayoutRail] = useState<'wise' | 'stripe_connect'>('wise')
  const [currency, setCurrency] = useState<string>('THB')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [email, setEmail] = useState('')

  const loadGym = useCallback(async () => {
    if (!user || !gymIdParam) {
      setGym(null)
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data, error: qErr } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymIdParam)
      .eq('owner_id', user.id)
      .maybeSingle()
    if (qErr || !data) {
      setGym(null)
      setError(qErr?.message || 'Gym not found.')
    } else {
      setError(null)
      const g = data as Gym
      setGym(g)
      const rail = (g.payout_rail as 'wise' | 'stripe_connect') || 'wise'
      setPayoutRail(rail)
      setCurrency((g.wise_recipient_currency || g.currency || 'THB').toString().toUpperCase().slice(0, 3))
    }
    setLoading(false)
  }, [user, gymIdParam])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (!profile) {
      router.replace('/auth/role-selection')
      return
    }
    if (profile.role !== 'owner') {
      router.replace('/')
      return
    }
    if (!gymIdParam) {
      setLoading(false)
      setError('Missing gym. Open this page from onboarding or add ?gym_id=…')
      return
    }
    void loadGym()
  }, [authLoading, user, profile, router, gymIdParam, loadGym])

  useEffect(() => {
    if (!profile?.full_name) return
    setAccountHolderName((prev) => (prev.trim() ? prev : profile.full_name || ''))
  }, [profile?.full_name])

  const saveRail = async () => {
    if (!gymIdParam) return
    setSavingRail(true)
    setError(null)
    try {
      const res = await fetch(`/api/gyms/${encodeURIComponent(gymIdParam)}/payout-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payout_rail: payoutRail,
          ...(payoutRail === 'wise' ? { wise_recipient_currency: currency } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save payout method')
      await loadGym()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingRail(false)
    }
  }

  const saveWiseRecipient = async () => {
    if (!gymIdParam) return
    setSavingRecipient(true)
    setError(null)
    try {
      const res = await fetch('/api/wise/recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_id: gymIdParam,
          currency,
          account_holder_name: accountHolderName,
          email,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Wise recipient creation failed')
      await loadGym()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recipient save failed')
    } finally {
      setSavingRecipient(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] px-4 py-8">
        <div className="mx-auto max-w-2xl animate-pulse space-y-4">
          <div className="h-8 rounded bg-gray-200" />
          <div className="h-48 rounded-xl bg-gray-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <ManageBreadcrumbs
          items={[
            { label: 'Dashboard', href: '/manage' },
            { label: 'Payout setup', href: gymIdParam ? `/manage/payouts/setup?gym_id=${encodeURIComponent(gymIdParam)}` : '/manage/payouts/setup' },
          ]}
        />
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payout setup</h1>
          <p className="mt-1 text-sm text-gray-600">
            Choose how CombatStay pays you for completed bookings. Wise is the default for international gyms; Stripe
            Connect remains available if you already use it.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
        ) : null}

        {!gymIdParam ? null : !gym ? (
          <p className="text-sm text-gray-600">We could not load that gym for your account.</p>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payout method</CardTitle>
                <CardDescription>
                  Go-live readiness checks this step. You can switch methods later; switching away from Wise clears saved
                  Wise recipient data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payout-rail">Method</Label>
                  <Select
                    id="payout-rail"
                    value={payoutRail}
                    onChange={(e) => setPayoutRail(e.target.value as 'wise' | 'stripe_connect')}
                  >
                    <option value="wise">Wise (recommended)</option>
                    <option value="stripe_connect">Stripe Connect</option>
                  </Select>
                </div>
                {payoutRail === 'wise' ? (
                  <div className="space-y-2">
                    <Label htmlFor="payout-ccy">Payout currency</Label>
                    <Select id="payout-ccy" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}
                <Button type="button" onClick={() => void saveRail()} disabled={savingRail}>
                  {savingRail ? 'Saving…' : 'Save method'}
                </Button>
                {payoutRail === 'stripe_connect' ? (
                  <p className="text-sm text-gray-600">
                    Continue in{' '}
                    <Link href={`/manage/stripe-connect?gym_id=${encodeURIComponent(gym.id)}`} className="font-medium text-[#003580] underline-offset-2 hover:underline">
                      Stripe Connect
                    </Link>
                    .
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {payoutRail === 'wise' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Wise recipient (email)</CardTitle>
                  <CardDescription>
                    Prototype: creates a Wise <strong>email</strong> recipient in sandbox/live using your server token.
                    Recipient must have a Wise account at this email for real payouts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pay-name">Legal / account name</Label>
                    <Input
                      id="pay-name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="First Last or business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pay-email">Recipient Wise email</Label>
                    <Input
                      id="pay-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@example.com"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void saveWiseRecipient()} disabled={savingRecipient}>
                      {savingRecipient ? 'Saving…' : 'Create Wise recipient'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Status:{' '}
                    {gym.wise_payout_ready && gym.wise_recipient_id
                      ? `Ready (recipient id ${gym.wise_recipient_id})`
                      : 'Not ready — save method and create recipient.'}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}

        <p className="text-center text-xs text-gray-500">
          <Link href="/manage/onboarding?step=step-5" className="text-[#003580] underline-offset-2 hover:underline">
            Back to onboarding
          </Link>
        </p>
      </div>
    </div>
  )
}
