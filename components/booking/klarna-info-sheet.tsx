'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { KlarnaWordmark } from '@/components/booking/klarna-wordmark'
import { formatCheckoutPriceWithCode } from '@/components/booking/checkout-ui'

const KLARNA_PAY_IN_4_TERMS_URL =
  'https://www.klarna.com/international/terms-and-conditions/'

export function KlarnaInfoSheet({
  open,
  onClose,
  totalPrice,
  currency,
}: {
  open: boolean
  onClose: () => void
  totalPrice: number
  currency: string
}) {
  const installment = totalPrice / 4

  useEffect(() => {
    if (!open) return
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[320] flex items-end justify-center px-4 pb-6 sm:items-center sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="klarna-info-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 touch-none"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl px-6 pt-6 pb-6 max-h-[min(85dvh,32rem)] overflow-y-auto overscroll-contain">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close Klarna information"
        >
          <X className="w-4 h-4 text-gray-800" />
        </button>

        <KlarnaWordmark className="text-[1.75rem] leading-none" />

        <h2 id="klarna-info-title" className="mt-5 text-[1.625rem] font-bold leading-tight text-gray-900">
          Pay in 4 payments
        </h2>

        <p className="mt-3 text-[15px] leading-snug text-gray-900">
          4 payments of {formatCheckoutPriceWithCode(installment, currency)}. Interest-free.
        </p>

        <p className="mt-4 text-[15px] leading-relaxed text-gray-700">
          Connect your credit or debit card to make payments automatically. No extra fees if paid
          on time.
        </p>

        <hr className="my-5 border-gray-200" />

        <p className="text-xs leading-relaxed text-gray-500">
          Pay in 4 is offered by Klarna. Please note that a higher initial payment may be required
          for some consumers. Missed payments may be subject to late fees. Read Klarna&apos;s Pay
          later in 4 installments{' '}
          <a
            href={KLARNA_PAY_IN_4_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 underline font-medium hover:text-gray-900"
          >
            terms
          </a>{' '}
          for more information.
        </p>
      </div>
    </div>
  )
}
