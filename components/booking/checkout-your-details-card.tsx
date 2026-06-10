'use client'

import { formatCheckoutSummaryValue } from '@/components/booking/checkout-ui'

export function CheckoutYourDetailsCard({
  name,
  email,
  phone,
  onEdit,
}: {
  name: string | null | undefined
  email: string | null | undefined
  phone: string | null | undefined
  onEdit: () => void
}) {
  return (
    <div className="border border-gray-200 rounded-xl px-4 py-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Your details</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-900 can-hover:hover:bg-gray-200 active:bg-gray-200 transition-colors touch-manipulation"
        >
          Change
        </button>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-semibold text-gray-900">Name</dt>
          <dd className="mt-0.5 text-gray-700">{formatCheckoutSummaryValue(name)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-900">Email</dt>
          <dd className="mt-0.5 text-gray-700 break-all">{formatCheckoutSummaryValue(email)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-900">Phone</dt>
          <dd className="mt-0.5 text-gray-700">{formatCheckoutSummaryValue(phone)}</dd>
        </div>
      </dl>
    </div>
  )
}
