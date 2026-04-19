import Link from 'next/link'

/**
 * Hub for the Stripe Connect **sample** integration (V2 accounts, platform products, Checkout).
 * This is isolated from production gym booking flows under `/manage/...`.
 */
export default function SamplesConnectHubPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200/90 bg-white p-8 shadow-md">
        <h1 className="text-xl font-semibold tracking-tight text-[#003580]">Stripe Connect sample</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Demo flows: V2 connected accounts (recipient), platform products with metadata mapping, hosted Checkout
          with destination charges + application fee. See API routes under{' '}
          <code className="rounded bg-gray-100 px-1 text-xs">/api/samples/connect/</code>.
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          <li>
            <Link className="font-medium text-[#003580] underline-offset-2 hover:underline" href="/samples/connect/seller">
              Seller onboarding &amp; status
            </Link>
            <span className="text-gray-500"> — create V2 account, Account Link, live status from API</span>
          </li>
          <li>
            <Link className="font-medium text-[#003580] underline-offset-2 hover:underline" href="/samples/connect/store">
              Storefront (buy)
            </Link>
            <span className="text-gray-500"> — list platform products, Checkout session</span>
          </li>
        </ul>
        <p className="mt-8 text-xs text-muted-foreground">
          Requires <code className="rounded bg-gray-100 px-1">STRIPE_SECRET_KEY</code> and{' '}
          <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_APP_URL</code> in{' '}
          <code className="rounded bg-gray-100 px-1">.env.local</code>. Optional:{' '}
          <code className="rounded bg-gray-100 px-1">STRIPE_CONNECT_SAMPLE_WEBHOOK_SECRET</code> for thin Connect
          webhooks at <code className="rounded bg-gray-100 px-1">/api/samples/connect/webhooks</code> (see route
          comments for <code className="rounded bg-gray-100 px-1">stripe listen</code>).
        </p>
      </div>
    </div>
  )
}
