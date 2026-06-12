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
  const displayName = formatCheckoutSummaryValue(name)
  const displayEmail = formatCheckoutSummaryValue(email)
  const displayPhone = formatCheckoutSummaryValue(phone)
  const hasAnyDetails =
    displayName !== '—' || displayEmail !== '—' || displayPhone !== '—'

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-gray-900">Your details</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-900 can-hover:hover:bg-gray-200 active:bg-gray-200 transition-colors touch-manipulation"
        >
          Change
        </button>
      </div>
      {hasAnyDetails ? (
        <div className="mt-2 space-y-0.5 text-sm text-gray-600 leading-snug">
          <p>{displayName}</p>
          <p>{displayEmail}</p>
          <p>{displayPhone}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-600 leading-snug">
          Add your name, email, and phone
        </p>
      )}
    </div>
  )
}
