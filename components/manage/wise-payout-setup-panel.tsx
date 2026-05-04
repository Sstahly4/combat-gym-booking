'use client'

import { Building2, CheckCircle2, Globe2, Loader2, Mail, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { GYM_CURRENCY_OPTIONS, normalizeGymCurrency } from '@/lib/constants/gym-currencies'
import { cn } from '@/lib/utils'
import type { Gym } from '@/lib/types/database'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

const WISE_HELP_HREF = 'https://wise.com/help/articles/2978047-how-do-i-receive-money-with-wise'

export type WisePayoutSetupPanelProps = {
  gym: Gym
  accountEmail: string | null
  currency: string
  onCurrencyChange: (code: string) => void
  accountHolderName: string
  onAccountHolderNameChange: (v: string) => void
  email: string
  onEmailChange: (v: string) => void
  savingDetails: boolean
  onSaveDetails: () => void | Promise<void>
}

export function WisePayoutSetupPanel({
  gym,
  accountEmail,
  currency,
  onCurrencyChange,
  accountHolderName,
  onAccountHolderNameChange,
  email,
  onEmailChange,
  savingDetails,
  onSaveDetails,
}: WisePayoutSetupPanelProps) {
  const wiseReady = Boolean(gym.wise_payout_ready && gym.wise_recipient_id)
  const listingCurrency = (gym.currency || 'USD').toUpperCase()
  const accountEmailHint = accountEmail?.trim() || null

  return (
    <div className="space-y-6">
      <section
        className={cn(
          dashCard,
          'overflow-hidden border-l-[3px] border-l-[#003580]'
        )}
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50/90 to-white px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#003580]">
                Payout option · Bank transfer (Wise)
              </p>
              {wiseReady ? (
                <>
                  <h2 className="mt-1 text-base font-semibold text-gray-900">Recipient on file</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                    Your Wise pay-to-email recipient is registered for this listing. Update the fields below if your
                    legal name, Wise login email, or preferred payout currency changes—we&apos;ll sync with Wise when
                    you save.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-1 text-base font-semibold text-gray-900">Set up Wise payouts</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                    Guests pay through CombatStay; your host share is sent to the payout route you choose. Wise works
                    well for international bank transfers and when your bank account is in a different currency than
                    your listing. We only keep a Wise recipient reference on this listing—not your full bank details on
                    our servers.
                  </p>
                </>
              )}
            </div>
            <div className="hidden shrink-0 rounded-lg border border-gray-200/90 bg-white px-3 py-2 text-center sm:block">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Listing currency</p>
              <p className="text-sm font-semibold tabular-nums text-gray-900">{listingCurrency}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <div className="space-y-5 text-sm text-gray-700">
            {!wiseReady ? (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Before you save</h3>
                <ul className="mt-3 space-y-2.5">
                  <li className="flex gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span>
                      <span className="font-medium text-gray-900">Wise profile</span> — the email you enter must be
                      one you use to sign in to Wise, and that profile must be able to receive{' '}
                      {normalizeGymCurrency(currency, 'USD')} payouts.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                    <span>
                      <span className="font-medium text-gray-900">Legal name</span> — spell it exactly as on the Wise
                      account (person or registered business).
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                    <span>
                      <span className="font-medium text-gray-900">Payout currency</span> — the currency Wise should use
                      when we send this listing&apos;s transfers (often your bank&apos;s currency).
                    </span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="flex gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
                <div className="min-w-0 text-sm text-emerald-950">
                  <p className="font-semibold">Ready for payouts</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-900/90">
                    Transfers for this listing use Wise in{' '}
                    <span className="font-medium tabular-nums">{normalizeGymCurrency(currency, 'USD')}</span>. Edit and
                    save below if anything changes before the next payout.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-xs leading-relaxed text-gray-600">
              <span className="font-medium text-gray-800">Privacy:</span> details are sent to Wise over TLS to create a
              pay-to-email recipient. We store the recipient id and a readiness flag so payouts can be routed
              correctly.{' '}
              <a
                href={WISE_HELP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#003580] underline-offset-2 hover:underline"
              >
                Wise: receiving money
              </a>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/50 px-4 py-3 text-xs text-sky-950">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden />
              <p>
                <span className="font-medium">After you go live:</span> when a payout is sent, your Partner Hub balance
                can update automatically once Wise confirms the transfer (no action needed on your side).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-sm font-semibold text-gray-900">Payout details</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {wiseReady
                  ? 'Change any field and save to update your listing and Wise recipient.'
                  : 'Enter your legal name, payout currency, and Wise email—then save once to register everything.'}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wise-pay-name" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <User className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  Account holder (legal or business name)
                </Label>
                <Input
                  id="wise-pay-name"
                  value={accountHolderName}
                  onChange={(e) => onAccountHolderNameChange(e.target.value)}
                  placeholder="As shown in Wise"
                  autoComplete="name"
                  className="border-gray-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wise-payout-ccy" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <Globe2 className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  Payout currency
                </Label>
                <Select
                  id="wise-payout-ccy"
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  className="w-full border-gray-200 bg-white"
                >
                  {GYM_CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
                <p className="text-[11px] leading-relaxed text-gray-500">
                  Currency Wise uses when we send this listing&apos;s transfers—not necessarily the same as your
                  listing currency ({listingCurrency}).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wise-pay-email" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <Mail className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  Wise account email
                </Label>
                <Input
                  id="wise-pay-email"
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="name@domain.com"
                  autoComplete="email"
                  className="border-gray-200 bg-white"
                />
                <p className="text-[11px] leading-relaxed text-gray-500">
                  {accountEmailHint ? (
                    <>
                      Pre-filled from your CombatStay account email ({accountEmailHint}). Change it only if you sign in
                      to Wise with a different address.
                    </>
                  ) : (
                    <>Use the same email you use to sign in to Wise.</>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {wiseReady
                  ? 'Saving updates your listing and re-validates the recipient with Wise if details changed.'
                  : 'One save stores your payout currency on this listing and registers your Wise recipient.'}
              </p>
              <Button
                type="button"
                onClick={() => void onSaveDetails()}
                disabled={savingDetails}
                className="h-9 shrink-0 bg-[#003580] px-5 text-sm font-medium text-white hover:bg-[#002a5c] sm:w-auto"
              >
                {savingDetails ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : wiseReady ? (
                  'Save changes'
                ) : (
                  'Save payout details'
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
