'use client'

import { formatCheckoutSummaryValue } from '@/components/booking/checkout-ui'

function condensedDetailsLine(
  name: string | null | undefined,
  email: string | null | undefined,
  phone: string | null | undefined
): string {
  return [name, email, phone]
    .map((value) => formatCheckoutSummaryValue(value))
    .filter((value) => value !== '—')
    .join(' · ')
}

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
  const summary = condensedDetailsLine(name, email, phone)

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
      <p className="mt-2 text-sm text-gray-600 leading-snug line-clamp-2">
        {summary || 'Add your name, email, and phone'}
      </p>
    </div>
  )
}
