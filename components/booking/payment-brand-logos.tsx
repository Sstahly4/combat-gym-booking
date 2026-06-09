'use client'

import type { ReactNode } from 'react'
import { CreditCard } from 'lucide-react'
import type { PaymentMethodChoice } from '@/components/booking/payment-method-picker'

/** Official wallet marks from brand asset downloads in /public/icons/payment */
export const PAYMENT_BRAND_ASSETS = {
  applePay: '/icons/payment/apple-pay.svg',
  googlePay: '/icons/payment/google-pay-mark_800.svg',
  visa: '/icons/payment/visa-mark.svg',
  mastercard: '/icons/payment/mastercard-mark.svg',
  amex: '/icons/payment/amex-mark.svg',
} as const

/**
 * Wallet marks in the Pay with picker — 20px (h-5) row height, aligned with the card icon.
 * @see https://developer.apple.com/apple-pay/marketing/
 * @see https://developers.google.com/pay/api/web/guides/brand-guidelines
 */
const WALLET_MARK_SLOTS = {
  list: {
    apple: 'h-5 w-[2.75rem]',
    google: 'h-5 w-[2.75rem]',
  },
  compact: {
    apple: 'h-5 w-[2.25rem]',
    google: 'h-5 w-[2.75rem]',
  },
} as const

type WalletMarkSize = keyof typeof WALLET_MARK_SLOTS

function WalletMarkSlot({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-start overflow-visible ${className}`}>
      {children}
    </span>
  )
}

type BrandImageProps = {
  src: string
  alt: string
  className: string
}

function PaymentBrandImage({ src, alt, className }: BrandImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- official brand SVG assets from /public
    <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
  )
}

/** Google Pay acceptance mark — Google Pay API brand assets */
export function GooglePayMark({
  size = 'list',
  className,
}: {
  size?: WalletMarkSize
  className?: string
}) {
  const slot = WALLET_MARK_SLOTS[size]
  const markClass = ['block h-full w-full object-contain object-left', className]
    .filter(Boolean)
    .join(' ')
  return (
    <WalletMarkSlot className={slot.google}>
      <PaymentBrandImage src={PAYMENT_BRAND_ASSETS.googlePay} alt="Google Pay" className={markClass} />
    </WalletMarkSlot>
  )
}

/** Apple Pay acceptance mark — Apple Pay Marketing Guidelines */
export function ApplePayMark({
  size = 'list',
  className,
}: {
  size?: WalletMarkSize
  className?: string
}) {
  const slot = WALLET_MARK_SLOTS[size]
  const markClass = ['block h-full w-full object-contain object-left', className]
    .filter(Boolean)
    .join(' ')
  return (
    <WalletMarkSlot className={slot.apple}>
      <PaymentBrandImage src={PAYMENT_BRAND_ASSETS.applePay} alt="Apple Pay" className={markClass} />
    </WalletMarkSlot>
  )
}

const CARD_BRAND_LOGO_SIZES = {
  /** Below the card label in the Pay with picker */
  subtext: {
    height: 'h-3',
    gap: 'gap-2',
    slots: ['w-[1.75rem]', 'w-5', 'w-[2.125rem]'] as const,
  },
  compact: {
    height: 'h-3.5',
    gap: 'gap-2',
    slots: ['w-8', 'w-6', 'w-[2.375rem]'] as const,
  },
} as const

const CARD_BRAND_MARKS = [
  { src: PAYMENT_BRAND_ASSETS.visa, alt: 'Visa' },
  { src: PAYMENT_BRAND_ASSETS.mastercard, alt: 'Mastercard' },
  { src: PAYMENT_BRAND_ASSETS.amex, alt: 'American Express' },
] as const

function CardBrandMark({
  src,
  alt,
  slotClass,
  heightClass,
}: {
  src: string
  alt: string
  slotClass: string
  heightClass: string
}) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-start ${heightClass} ${slotClass}`}>
      <PaymentBrandImage
        src={src}
        alt={alt}
        className="block h-full w-auto max-w-full object-contain object-left"
      />
    </span>
  )
}

export function CardBrandLogosRow({
  className,
  size = 'compact',
}: {
  className?: string
  size?: keyof typeof CARD_BRAND_LOGO_SIZES
}) {
  const s = CARD_BRAND_LOGO_SIZES[size]
  return (
    <div className={`inline-flex items-center ${s.gap} ${className ?? ''}`} aria-hidden>
      {CARD_BRAND_MARKS.map((mark, index) => (
        <CardBrandMark
          key={mark.alt}
          src={mark.src}
          alt={mark.alt}
          slotClass={s.slots[index]}
          heightClass={s.height}
        />
      ))}
    </div>
  )
}

/**
 * Collapsed payment-method row on Confirm and pay — compact icon/mark beside the label.
 * Picker list uses larger `list` marks; summary uses `compact` (~20px) so marks stay inline with text.
 */
export function PaymentMethodSummaryIcon({
  method,
}: {
  method: PaymentMethodChoice
}) {
  if (method === 'card') {
    return (
      <span className="inline-flex h-5 w-[2.25rem] items-center justify-start">
        <CreditCard className="h-5 w-5 shrink-0 text-gray-900" strokeWidth={1.75} />
      </span>
    )
  }
  if (method === 'apple_pay') {
    return <ApplePayMark size="compact" />
  }
  if (method === 'google_pay') {
    return <GooglePayMark size="compact" />
  }
  return null
}
