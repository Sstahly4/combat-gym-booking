'use client'

/**
 * Stripe Connect onboarding — drawer overlay mode.
 *
 * ConnectAccountOnboarding opens steps in Stripe's side drawer, not inline.
 * This section explains that and mounts the embedded component without an
 * empty card shell that looks broken.
 */
import { PanelRightOpen } from 'lucide-react'
import { ConnectAccountOnboarding } from '@stripe/react-connect-js'
import { StripeAuthenticatorCoachPanel } from '@/components/manage/stripe-authenticator-coach-panel'
import type { Gym } from '@/lib/types/database'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

type Props = {
  gym: Gym
  preferredLanguage?: string | null
  onExit: () => void | Promise<void>
}

export function StripeConnectOnboardingSection({ gym, preferredLanguage, onExit }: Props) {
  return (
    <div
      id="stripe-onboarding"
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <section className={`${dashCard} overflow-hidden`}>
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#003580]/10 ring-1 ring-[#003580]/15">
              <PanelRightOpen className="h-4 w-4 text-[#003580]" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <h3 className="text-base font-semibold tracking-tight text-gray-900">
                Complete verification in Stripe
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Stripe opens a secure panel on the side of this page. Follow each prompt for identity,
                bank account, and security setup. When you finish, the panel closes and your status
                updates here automatically.
              </p>
            </div>
          </div>

          {/*
            Stripe renders a compact trigger here and runs the full flow in overlays: 'drawer'.
            Avoid extra padding/min-height so we do not show an empty box when the drawer is open.
          */}
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
            <ConnectAccountOnboarding
              onExit={() => {
                void onExit()
              }}
            />
          </div>

          {!gym.stripe_connect_verified ? (
            <p className="text-xs leading-relaxed text-gray-500">
              Panel did not open? Scroll up and tap{' '}
              <strong className="font-medium text-gray-700">Continue payout setup</strong> again, or refresh
              this page.
            </p>
          ) : null}
        </div>
      </section>

      <StripeAuthenticatorCoachPanel preferredLanguage={preferredLanguage} />
    </div>
  )
}
