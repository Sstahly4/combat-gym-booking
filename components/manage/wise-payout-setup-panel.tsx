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
  currency: string
  onCurrencyChange: (code: string) => void
  accountHolderName: string
  onAccountHolderNameChange: (v: string) => void
  email: string
  onEmailChange: (v: string) => void
  savingRail: boolean
  savingRecipient: boolean
  onSavePayoutPreferences: () => void | Promise<void>
  onSaveRecipient: () => void | Promise<void>
}

export function WisePayoutSetupPanel({
  gym,
  currency,
  onCurrencyChange,
  accountHolderName,
  onAccountHolderNameChange,
  email,
  onEmailChange,
  savingRail,
  savingRecipient,
  onSavePayoutPreferences,
  onSaveRecipient,
}: WisePayoutSetupPanelProps) {
  const wiseReady = Boolean(gym.wise_payout_ready && gym.wise_recipient_id)
  const listingCurrency = (gym.currency || 'USD').toUpperCase()

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
                Payout option · Bank transfer
              </p>
              <h2 className="mt-1 text-base font-semibold text-gray-900">Receive payouts to Wise</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                Same idea as other travel platforms: guests pay the platform; we send your share to the payout method
                you choose. Wise is suited to international transfers and multi-currency balances. We only store a
                Wise recipient reference on your listing — not your full bank details.
              </p>
            </div>
            <div className="hidden shrink-0 rounded-lg border border-gray-200/90 bg-white px-3 py-2 text-center sm:block">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Listing currency</p>
              <p className="text-sm font-semibold tabular-nums text-gray-900">{listingCurrency}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="space-y-5 text-sm text-gray-700">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Before you start</h3>
              <ul className="mt-3 space-y-2.5">
                <li className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>
                    <span className="font-medium text-gray-900">Wise account</span> — the recipient email must belong
                    to a Wise profile that can receive {normalizeGymCurrency(currency, 'USD')} payouts.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  <span>
                    <span className="font-medium text-gray-900">Legal name</span> — use the same spelling as on the
                    Wise account (person or registered business).
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  <span>
                    <span className="font-medium text-gray-900">Payout currency</span> — choose the currency Wise should
                    use for this listing&apos;s transfers (often your bank&apos;s currency).
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-xs leading-relaxed text-gray-600">
              <span className="font-medium text-gray-800">Privacy:</span> recipient details are sent to Wise over TLS to
              create a pay-to-email recipient. We keep the recipient id and readiness flag on your listing so we can
              route future payouts.{' '}
              <a
                href={WISE_HELP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#003580] underline-offset-2 hover:underline"
              >
                Wise help: receiving money
              </a>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/50 px-4 py-3 text-xs text-sky-950">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden />
              <p>
                <span className="font-medium">After you go live:</span> when a payout is sent to your Wise account, your
                Partner Hub balance can update automatically as soon as Wise confirms the transfer to your bank (no
                action needed on your side).
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003580] text-xs font-bold text-white">
                  1
                </span>
                <h3 className="text-sm font-semibold text-gray-900">Payout currency &amp; method</h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                Save this listing to the bank-transfer rail and set the currency for outbound payouts.
              </p>
              <div className="mt-4 space-y-2">
                <Label htmlFor="wise-payout-ccy" className="text-xs font-medium text-gray-700">
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
              </div>
              <div className="mt-5 flex justify-end">
                <Button
                  type="button"
                  onClick={() => void onSavePayoutPreferences()}
                  disabled={savingRail}
                  className="h-9 bg-[#003580] px-5 text-sm font-medium text-white hover:bg-[#002a5c]"
                >
                  {savingRail ? (
                    <>
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    'Save payout preferences'
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003580] text-xs font-bold text-white">
                  2
                </span>
                <h3 className="text-sm font-semibold text-gray-900">Recipient verification</h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                These fields must match the Wise profile that will receive funds. We validate them with Wise when you
                confirm.
              </p>

              {wiseReady ? (
                <div className="mt-4 flex gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
                  <div className="min-w-0 text-sm text-emerald-950">
                    <p className="font-semibold">Recipient on file</p>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-900/90">
                      Payouts to this listing can be sent to your Wise account in{' '}
                      <span className="font-medium tabular-nums">
                        {normalizeGymCurrency(currency, 'USD')}
                      </span>
                      . You may update the name or email before the next transfer if your bank details changed.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 sm:grid-cols-1">
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
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  {wiseReady
                    ? 'Update and save if your Wise login or legal name changed.'
                    : 'Confirm to register your recipient with Wise and mark this step complete for go-live checks.'}
                </p>
                <Button
                  type="button"
                  onClick={() => void onSaveRecipient()}
                  disabled={savingRecipient}
                  className="h-9 shrink-0 bg-[#003580] px-5 text-sm font-medium text-white hover:bg-[#002a5c] sm:w-auto"
                >
                  {savingRecipient ? (
                    <>
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
                      Confirming…
                    </>
                  ) : wiseReady ? (
                    'Update recipient'
                  ) : (
                    'Confirm recipient with Wise'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
