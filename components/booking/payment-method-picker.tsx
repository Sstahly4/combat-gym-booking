'use client'

import type { ReactNode } from 'react'
import { CreditCard } from 'lucide-react'

export type PaymentMethodChoice = 'card' | 'apple_pay' | 'google_pay'

function PaymentMethodRadio({ selected }: { selected: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
        selected ? 'border-gray-900' : 'border-gray-300'
      }`}
      aria-hidden
    >
      {selected && <span className="h-3.5 w-3.5 rounded-full bg-gray-900" />}
    </span>
  )
}

function CardBrandLogos() {
  return (
    <div className="flex items-center gap-3 mt-1.5">
      <span className="text-[11px] font-bold tracking-wide text-[#1A1F71]">VISA</span>
      <span className="flex items-center gap-0.5" aria-label="Mastercard">
        <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
        <span className="-ml-2 h-3.5 w-3.5 rounded-full bg-[#F79E1B]" />
      </span>
      <span className="text-[10px] font-bold tracking-wide text-[#006FCF]">AMEX</span>
    </div>
  )
}

function GooglePayIcon() {
  return (
    <span className="text-[13px] font-semibold tracking-tight text-gray-900" aria-hidden>
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#EA4335]">o</span>
      <span className="text-[#FBBC05]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#34A853]">l</span>
      <span className="text-[#EA4335]">e</span>
      <span className="text-gray-900"> Pay</span>
    </span>
  )
}

function ApplePayIcon() {
  return (
    <span
      className="inline-flex items-center rounded-md bg-gray-900 px-1.5 py-1 text-[10px] font-semibold text-white leading-none"
      aria-hidden
    >
      Pay
    </span>
  )
}

function PaymentMethodOption({
  selected,
  onSelect,
  label,
  icon,
  children,
  ariaLabel,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  icon: ReactNode
  children?: ReactNode
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-4 flex items-center gap-4 transition-colors hover:bg-gray-50/80"
      aria-pressed={selected}
      aria-label={ariaLabel}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-900">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-gray-900">{label}</div>
        {children}
      </div>
      <PaymentMethodRadio selected={selected} />
    </button>
  )
}

export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethodChoice
  onChange: (method: PaymentMethodChoice) => void
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
      <PaymentMethodOption
        selected={value === 'card'}
        onSelect={() => onChange('card')}
        label="Credit or debit card"
        icon={<CreditCard className="h-5 w-5" strokeWidth={1.75} />}
        ariaLabel="Pay with credit or debit card"
      >
        <CardBrandLogos />
      </PaymentMethodOption>
      <PaymentMethodOption
        selected={value === 'google_pay'}
        onSelect={() => onChange('google_pay')}
        label="Google Pay"
        icon={<GooglePayIcon />}
        ariaLabel="Pay with Google Pay"
      />
      <PaymentMethodOption
        selected={value === 'apple_pay'}
        onSelect={() => onChange('apple_pay')}
        label="Apple Pay"
        icon={<ApplePayIcon />}
        ariaLabel="Pay with Apple Pay"
      />
    </div>
  )
}
