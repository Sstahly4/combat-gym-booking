'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { settingsCardClass } from '@/components/manage/settings-shared'
import { PayoutsHoldBanner } from '@/components/manage/payouts-hold-banner'

type GymPayoutSummary = {
  id: string
  name: string
  payout_rail: 'wise' | 'stripe_connect' | null
  wise_recipient_id: string | null
  wise_recipient_currency: string | null
  wise_payout_ready: boolean | null
  stripe_account_id: string | null
  stripe_connect_verified: boolean
  stripe_charges_enabled: boolean | null
  stripe_payouts_enabled: boolean | null
  stripe_details_submitted: boolean | null
  stripe_requirements_currently_due: string[] | null
  stripe_requirements_pending_verification: string[] | null
  stripe_disabled_reason: string | null
  last_stripe_account_sync_at: string | null
  payout_disabled_notified_at: string | null
  payouts_hold_active: boolean | null
  payouts_hold_reason: string | null
  payouts_hold_set_at: string | null
}

function formatSyncLabel(iso: string | null): string {
  if (!iso) return 'Not synced yet — open your connected account or wait for the next update.'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function SettingsPayoutsSection() {
  const { user, loading: authLoading } = useAuth()
  const [gyms, setGyms] = useState<GymPayoutSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('gyms')
        .select(
          `id, name, payout_rail, wise_recipient_id, wise_recipient_currency, wise_payout_ready,
           stripe_account_id, stripe_connect_verified,
           stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted,
           stripe_requirements_currently_due, stripe_requirements_pending_verification,
           stripe_disabled_reason, last_stripe_account_sync_at, payout_disabled_notified_at,
           payouts_hold_active, payouts_hold_reason, payouts_hold_set_at`
        )
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      setGyms((data || []) as GymPayoutSummary[])
      setLoading(false)
    }
    if (!authLoading) void load()
  }, [authLoading, user])

  return (
    <div id="settings-payouts-section" className="space-y-6">
      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">Payout readiness</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Bank transfer (Wise) details are stored on your gym. Connected account status updates when your provider
            syncs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading payout status...</p>
          ) : gyms.length === 0 ? (
            <p className="text-sm text-gray-500">No gyms found.</p>
          ) : (
            gyms.map((gym) => {
              const rail = (gym.payout_rail as 'wise' | 'stripe_connect' | null) ?? 'wise'
              if (rail === 'wise') {
                const ready = Boolean(gym.wise_payout_ready && gym.wise_recipient_id)
                return (
                  <div key={gym.id} className="space-y-3 rounded-lg border border-gray-200 bg-slate-50/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{gym.name}</p>
                        <p className="text-xs text-gray-500">Payout method: Wise</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Recipient:{' '}
                          {gym.wise_recipient_id ? (
                            <span className="font-mono text-gray-700">{gym.wise_recipient_id}</span>
                          ) : (
                            'Not set'
                          )}
                          {gym.wise_recipient_currency ? ` · ${gym.wise_recipient_currency}` : ''}
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          ready ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80' : 'bg-slate-100 text-slate-800 ring-1 ring-slate-200'
                        }`}
                      >
                        {ready ? 'Wise ready' : 'Action required'}
                      </span>
                    </div>
                    {gym.payouts_hold_active ? (
                      <PayoutsHoldBanner
                        variant="settings"
                        active
                        reason={gym.payouts_hold_reason}
                        setAt={gym.payouts_hold_set_at}
                      />
                    ) : null}
                    <Link href={`/manage/balances/payouts?gym_id=${encodeURIComponent(gym.id)}`}>
                      <Button variant="outline" size="sm" className="border-gray-300">
                        Open payouts
                      </Button>
                    </Link>
                  </div>
                )
              }

              const due = gym.stripe_requirements_currently_due || []
              const pending = gym.stripe_requirements_pending_verification || []
              const payoutsOn = gym.stripe_payouts_enabled === true
              const chargesOn = gym.stripe_charges_enabled === true
              const synced = Boolean(gym.last_stripe_account_sync_at)

              return (
                <div key={gym.id} className="space-y-3 rounded-lg border border-gray-200 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{gym.name}</p>
                      <p className="text-xs text-gray-500">Payout method: Connected account</p>
                      <p className="text-xs text-gray-500">
                        Account ID:{' '}
                        {gym.stripe_account_id ? (
                          <span className="font-mono text-gray-700">{gym.stripe_account_id}</span>
                        ) : (
                          'Not connected'
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Last sync: {formatSyncLabel(gym.last_stripe_account_sync_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          gym.stripe_connect_verified
                            ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80'
                            : 'bg-slate-100 text-slate-800 ring-1 ring-slate-200'
                        }`}
                      >
                        {gym.stripe_connect_verified ? 'Charges & payouts OK' : 'Action required'}
                      </span>
                      {synced ? (
                        <>
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              chargesOn ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800'
                            }`}
                          >
                            Charges: {chargesOn ? 'enabled' : 'disabled'}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              payoutsOn ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800'
                            }`}
                          >
                            Payouts: {payoutsOn ? 'enabled' : 'paused'}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {gym.payouts_hold_active ? (
                    <PayoutsHoldBanner
                      variant="settings"
                      active
                      reason={gym.payouts_hold_reason}
                      setAt={gym.payouts_hold_set_at}
                    />
                  ) : null}

                  {gym.stripe_disabled_reason ? (
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">Stripe: </span>
                      {gym.stripe_disabled_reason}
                    </p>
                  ) : null}

                  {gym.stripe_details_submitted === false && synced ? (
                    <p className="text-sm text-gray-700">
                      Account details are not fully submitted in Stripe yet — finish onboarding below.
                    </p>
                  ) : null}

                  {due.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-gray-800">Currently due</p>
                      <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                        {due.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {pending.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-gray-800">Pending verification</p>
                      <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                        {pending.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {gym.payout_disabled_notified_at ? (
                    <p className="text-xs text-gray-500">
                      We emailed you about paused payouts on {new Date(gym.payout_disabled_notified_at).toLocaleString()}.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/manage/stripe-connect?gym_id=${encodeURIComponent(gym.id)}`}>
                      <Button variant="outline" size="sm" className="border-gray-300">
                        Open connected account
                      </Button>
                    </Link>
                    <Link href={`/manage/balances/payouts?gym_id=${encodeURIComponent(gym.id)}`}>
                      <Button variant="ghost" size="sm" className="text-gray-700">
                        Switch payout method
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card className={settingsCardClass}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">About payout holds</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Two kinds of holds can affect your gym: Stripe pausing payouts for verification, and a short review after
            you change bank details (shown above when active).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            If you change your payout bank in Stripe, we flag a hold until Stripe finishes verification. The hold
            clears automatically when payouts are enabled again — see{' '}
            <Link href="/manage/balances" className="font-medium text-[#003580] underline-offset-2 hover:underline">
              Balances
            </Link>{' '}
            for live amounts.
          </p>
          <p>
            For Stripe requirement issues, open Connect and complete any outstanding items. We email when payouts are
            paused (if payout emails are enabled in Communications).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
