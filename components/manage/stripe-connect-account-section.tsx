'use client'

/**
 * Post-verification bank / business management — only shown once Stripe Connect
 * is fully verified so we never render an empty shell mid-onboarding.
 */
import { ConnectAccountManagement } from '@stripe/react-connect-js'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

export function StripeConnectAccountSection() {
  return (
    <section id="account-management" className={`${dashCard} overflow-hidden`}>
      <header className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold tracking-tight text-gray-900">Account &amp; bank details</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          Update your bank account, business profile, or verification when Stripe requests changes.
        </p>
      </header>
      <div className="px-3 py-3 sm:px-4">
        <ConnectAccountManagement />
      </div>
    </section>
  )
}
